import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import type { Point } from 'geojson';

@ObjectType() // This tells GraphQL about this object
@Entity()     // This tells TypeORM/Postgres about this table
export class Driver {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => [Number]) // GraphQL returns as [lat, lng]
  @Index({ spatial: true }) // CRITICAL: This makes searches 1000x faster
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326, // Standard GPS coordinate system
  })
  location: Point;
}