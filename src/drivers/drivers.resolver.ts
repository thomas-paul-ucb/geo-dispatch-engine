import { Resolver, Query, Args, Float } from '@nestjs/graphql';
import { DriversService } from './drivers.service';
import { Driver } from './driver.entity';

@Resolver(() => Driver)
export class DriversResolver {
  constructor(private readonly driversService: DriversService) {}

  @Query(() => [Driver], { name: 'nearbyDrivers' })
  async getNearbyDrivers(
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
  ) {
    return this.driversService.findNearby(lat, lng);
  }
}