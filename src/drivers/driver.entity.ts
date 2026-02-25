import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import type { Point } from 'geojson';

export enum DriverStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
}

// This is required for GraphQL to understand the Enum
registerEnumType(DriverStatus, {
  name: 'DriverStatus',
});

@ObjectType()
@Entity()
export class Driver {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => DriverStatus)
  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.AVAILABLE,
  })
  status: DriverStatus;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSeen: Date;

  @Field(() => [Number])
  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: Point;
}