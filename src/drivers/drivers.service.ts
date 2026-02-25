import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './driver.entity';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
  ) {}

  // The "Senior" Spatial Query
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
}