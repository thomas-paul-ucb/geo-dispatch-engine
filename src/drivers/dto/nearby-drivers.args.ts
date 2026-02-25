import { ArgsType, Field, Float } from '@nestjs/graphql';
import { IsNumber, Min, Max } from 'class-validator';

@ArgsType()
export class GetNearbyDriversArgs {
  @Field(() => Float)
  @IsNumber()
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90)
  lat: number;

  @Field(() => Float)
  @IsNumber()
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180)
  lng: number;
}