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
      // This allows us to search for drivers in memory in < 1ms
      const redis = this.pubSub.getPublisher();
      await redis.geoadd('driver_locations', lng, lat, driverId);

      // 2. Update Postgres (The Persistence Layer)
      // We do this so we don't lose the data if Redis restarts
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

  // Find all drivers within a radius (regardless of status)
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

  // The "Dispatch" Logic: Find the closest AVAILABLE driver and mark them BUSY
  async requestRide(userLat: number, userLng: number): Promise<Driver | null> {
    this.logger.log(`Incoming ride request at Lat: ${userLat}, Lng: ${userLng}`);

    // NOTE: In the next step, we will move this search logic to REDIS for 10x speed.
    // For now, we are still searching Postgres to verify the "Write" logic works.
    const closestDriver = await this.driversRepository
      .createQueryBuilder('driver')
      .where('driver.status = :status', { status: DriverStatus.AVAILABLE })
      .andWhere(
        `ST_DWithin(
          driver.location, 
          ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, 
          5000
        )`,
        { lng: userLng, lat: userLat }
      )
      .orderBy(`driver.location <-> ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography`, 'ASC')
      .getOne();

    if (!closestDriver) {
      this.logger.warn(`No drivers found within 5km for Lat: ${userLat}`);
      return null;
    }

    closestDriver.status = DriverStatus.BUSY;
    const savedDriver = await this.driversRepository.save(closestDriver); 
    
    // Notify subscribers via Redis Pub/Sub
    this.pubSub.publish('driverUpdated', { driverUpdated: savedDriver });

    this.logger.log(`Driver ${closestDriver.name} (${closestDriver.id}) dispatched successfully`);
    return savedDriver;
  }
}