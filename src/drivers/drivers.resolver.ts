import { Resolver, Query, Mutation, Subscription, Args, Float } from '@nestjs/graphql';
import { GetNearbyDriversArgs } from './dto/nearby-drivers.args'; // Import new DTO
import { Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { DriversService } from './drivers.service';
import { Driver } from './driver.entity';
import { UpdateLocationInput } from './dto/update-location.input'; // Add this import

@Resolver(() => Driver)
export class DriversResolver {
  constructor(private readonly driversService: DriversService,
    @Inject('PUB_SUB') private pubSub: RedisPubSub, // Inject the same board
  ) {}

  // Read: Find many drivers
  @Query(() => [Driver], { name: 'nearbyDrivers' })
  async getNearbyDrivers(@Args() args: GetNearbyDriversArgs) {
    return this.driversService.findNearby(args.lat, args.lng);
  }

  @Mutation(() => Boolean, { name: 'updateDriverLocation' })
  async updateDriverLocation(
    @Args('input') input: UpdateLocationInput,
  ) {
    return this.driversService.updateLocation(
      input.driverId,
      input.lat,
      input.lng,
    );
  }

  // Write: Request a ride and match a driver
  @Mutation(() => Driver, { name: 'requestRide', nullable: true })
  async requestRide(@Args() args: GetNearbyDriversArgs) {
    return this.driversService.requestRide(args.lat, args.lng);
  }

  // --- NEW: THE REAL-TIME EAR ---
  @Subscription(() => Driver, {
    name: 'driverUpdated',
  })
  driverUpdated() {
    // This tells GraphQL to listen to the 'driverUpdated' channel in Redis
    return this.pubSub.asyncIterator('driverUpdated');
  }
}