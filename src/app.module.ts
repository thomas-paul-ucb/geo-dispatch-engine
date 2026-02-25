import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { DriversModule } from './drivers/drivers.module';
import { Driver } from './drivers/driver.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'geo_dispatch',
      entities: [Driver],
      synchronize: true, // Only for development!
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      // Remove installSubscriptionHandlers: true (it's deprecated)
      subscriptions: {
        'graphql-ws': true,             // Modern protocol
        'subscriptions-transport-ws': true, // Legacy protocol (for Playground)
      },
    }),
    DriversModule,
  ],
})
export class AppModule {}