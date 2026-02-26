import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq'; 
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { DriversService } from './drivers.service';
import { DriversResolver } from './drivers.resolver';
import { Driver } from './driver.entity';
import { DriversProcessor } from './drivers.processor'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver]),
    BullModule.registerQueue({
      name: 'dispatch',
    }),
  ],
  providers: [
    DriversService,
    DriversResolver,
    DriversProcessor,
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