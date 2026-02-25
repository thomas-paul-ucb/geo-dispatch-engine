import { Resolver, Query, Mutation, Args, Float } from '@nestjs/graphql';
import { DriversService } from './drivers.service';
import { Driver } from './driver.entity';

@Resolver(() => Driver)
export class DriversResolver {
  constructor(private readonly driversService: DriversService) {}

  // Read: Find many drivers
  @Query(() => [Driver], { name: 'nearbyDrivers' })
  async getNearbyDrivers(
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
  ) {
    return this.driversService.findNearby(lat, lng);
  }

  // Write: Request a ride and match a driver
  @Mutation(() => Driver, { name: 'requestRide', nullable: true })
  async requestRide(
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
  ) {
    return this.driversService.requestRide(lat, lng);
  }
}