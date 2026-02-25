import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { DriversService } from './drivers.service';
import { DriversResolver } from './drivers.resolver';
import { Driver } from './driver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver])],
  providers: [
    DriversService,
    DriversResolver,
    {
      provide: 'PUB_SUB',
      useValue: new RedisPubSub({
        connection: {
          host: 'localhost',
          port: 6379,
        },
      }),
    },
  ],
  exports: [DriversService],
})
export class DriversModule {}