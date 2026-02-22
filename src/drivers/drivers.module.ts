import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversService } from './drivers.service';
import { DriversResolver } from './drivers.resolver';
import { Driver } from './driver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver])],
  providers: [DriversService, DriversResolver],
})
export class DriversModule {}