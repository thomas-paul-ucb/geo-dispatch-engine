import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './driver.entity';
import { RedisPubSub } from 'graphql-redis-subscriptions';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name); // Create logger instance

  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
    @Inject('PUB_SUB') private pubSub: RedisPubSub,
  ) {}

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

    const closestDriver = await this.driversRepository
      .createQueryBuilder('driver')
      // Only look for Available drivers
      .where('driver.status = :status', { status: DriverStatus.AVAILABLE })
      // Within 5000 meters (5km)
      .andWhere(
        `ST_DWithin(
          driver.location, 
          ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography, 
          5000
        )`,
        { lng: userLng, lat: userLat }
      )
      // Use the <-> PostGIS operator for ultra-fast KNN (Nearest Neighbor) sorting
      .orderBy(`driver.location <-> ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography`, 'ASC')
      .getOne();

    if (!closestDriver) {
      this.logger.warn(`No drivers found within 5km for Lat: ${userLat}`);
      return null;
    }

    // Change status to BUSY
    closestDriver.status = DriverStatus.BUSY;
    const savedDriver = await this.driversRepository.save(closestDriver); // Save to database
    
    // --- NEW: SHOUT TO REDIS ---
    // We publish the updated driver to the 'driverUpdated' channel
    this.pubSub.publish('driverUpdated', { driverUpdated: savedDriver });

    this.logger.log(`Driver ${closestDriver.name} (${closestDriver.id}) dispatched successfully`);
    return savedDriver;
  }
}