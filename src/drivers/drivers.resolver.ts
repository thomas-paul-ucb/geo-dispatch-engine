import { Resolver, Query } from '@nestjs/graphql';
import { DriversService } from './drivers.service';
import { Driver } from './driver.entity';

@Resolver(() => Driver)
export class DriversResolver {
  constructor(private readonly driversService: DriversService) {}

  @Query(() => [Driver], { name: 'drivers' }) // This provides the required "Query root type"
  async getDrivers() {
    return this.driversService.findAll();
  }
}