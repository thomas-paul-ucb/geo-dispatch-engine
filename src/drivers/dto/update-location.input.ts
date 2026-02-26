import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNumber, Min, Max, IsUUID } from 'class-validator';

@InputType()
export class UpdateLocationInput {
  @Field()
  @IsUUID()
  driverId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @Field(() => Float)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}