import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './driver.entity';
import { RedisPubSub } from 'graphql-redis-subscriptions';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
    @Inject('PUB_SUB') private pubSub: RedisPubSub,
  ) {}

  /**
   * UPDATE LOCATION (The "High Frequency" Write)
   * We write to Redis for speed and Postgres for persistence.
   */
  async updateLocation(driverId: string, lat: number, lng: number): Promise<boolean> {
    try {
      // 1. Write to Redis Geospatial Index (The Speed Layer)
      const redis = this.pubSub.getPublisher();
      await redis.geoadd('driver_locations', lng, lat, driverId);

      // 2. Update Postgres (The Persistence Layer)
      await this.driversRepository.update(driverId, {
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        lastSeen: new Date(),
      });

      this.logger.log(`Location updated for driver ${driverId} in Redis & DB`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update location for driver ${driverId}`, error.stack);
      return false;
    }
  }

  /**
   * FIND NEARBY (General Query)
   * Still using Postgres for general "Find All" queries.
   */
  async findNearby(userLat: number, userLng: number, radiusMeters: number = 2000): Promise<Driver[]> {
    return this.driversRepository
      .createQueryBuilder('driver')
      .where(
        `ST_DWithin(
          driver.location, 
          ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, 
          :radius
        )`,
        {
          lng: userLng,
          lat: userLat,
          radius: radiusMeters,
        },
      )
      .getMany();
  }

  /**
   * REQUEST RIDE (The "Redis-First" Dispatch)
   * 1. Search Redis for IDs of drivers within 5km.
   * 2. Filter those IDs in Postgres for AVAILABLE status.
   */
  async requestRide(userLat: number, userLng: number): Promise<Driver | null> {
    this.logger.log(`Incoming ride request at Lat: ${userLat}, Lng: ${userLng}`);

    const redis = this.pubSub.getPublisher();

    // STEP 1: Ask Redis for IDs of the 10 closest drivers within 5km
    // GEORADIUS returns just the member names (driver IDs) sorted by distance
    const nearbyDriverIds = (await redis.georadius(
  'driver_locations',
  userLng,
  userLat,
  5,
  'km',
  'ASC',
  'COUNT', 10
)) as string[];

    if (!nearbyDriverIds || nearbyDriverIds.length === 0) {
      this.logger.warn(`No drivers found in Redis within 5km for Lat: ${userLat}`);
      return null;
    }

    // STEP 2: Use those IDs to find the first AVAILABLE driver in Postgres
    const closestAvailableDriver = await this.driversRepository
      .createQueryBuilder('driver')
      .where('driver.id IN (:...ids)', { ids: nearbyDriverIds })
      .andWhere('driver.status = :status', { status: DriverStatus.AVAILABLE })
      // We still sort by Postgres list order to respect Redis's distance ranking
      .getOne();

    if (!closestAvailableDriver) {
      this.logger.warn(`Found ${nearbyDriverIds.length} drivers nearby in Redis, but none are AVAILABLE in DB`);
      return null;
    }

    // STEP 3: Atomic State Update
    closestAvailableDriver.status = DriverStatus.BUSY;
    const savedDriver = await this.driversRepository.save(closestAvailableDriver);

    // STEP 4: Real-time Notification
    this.pubSub.publish('driverUpdated', { driverUpdated: savedDriver });

    this.logger.log(`Redis-Optimized Dispatch: Driver ${savedDriver.name} (${savedDriver.id}) assigned.`);
    return savedDriver;
  }
}