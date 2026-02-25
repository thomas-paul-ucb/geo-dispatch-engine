import { Resolver, Query, Mutation, Subscription, Args, Float } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { DriversService } from './drivers.service';
import { Driver } from './driver.entity';

@Resolver(() => Driver)
export class DriversResolver {
  constructor(private readonly driversService: DriversService,
    @Inject('PUB_SUB') private pubSub: RedisPubSub, // Inject the same board
  ) {}

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

  // --- NEW: THE REAL-TIME EAR ---
  @Subscription(() => Driver, {
    name: 'driverUpdated',
  })
  driverUpdated() {
    // This tells GraphQL to listen to the 'driverUpdated' channel in Redis
    return this.pubSub.asyncIterator('driverUpdated');
  }
}