import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './driver.entity';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
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
      return null;
    }

    // Change status to BUSY
    closestDriver.status = DriverStatus.BUSY;
    
    // Save to database
    return this.driversRepository.save(closestDriver);
  }
}