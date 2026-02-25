import { DataSource } from 'typeorm';
import { Driver } from './src/drivers/driver.entity';
import { v4 as uuidv4 } from 'uuid';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'geo_dispatch',
  entities: [Driver],
});

const seed = async () => {
  await dataSource.initialize();
  const repository = dataSource.getRepository(Driver);

  // Boulder, CO coordinates
  const drivers = [
    { name: 'Driver Alpha', lat: 40.0076, lng: -105.2659 }, // Near Folsom Field
    { name: 'Driver Bravo', lat: 40.0150, lng: -105.2705 }, // Pearl St
    { name: 'Driver Charlie', lat: 40.0067, lng: -105.2323 }, // East Campus
    { name: 'Driver Delta', lat: 39.9981, lng: -105.2500 }, // Near Baseline
    { name: 'Driver Echo', lat: 40.0300, lng: -105.2500 }, // North Boulder
  ];

  for (const d of drivers) {
    const driver = repository.create({
      name: d.name,
      location: {
        type: 'Point',
        coordinates: [d.lng, d.lat], // Note: GeoJSON is [Longitude, Latitude]
      },
    });
    await repository.save(driver);
  }

  console.log('Seeding complete! 5 drivers added to Boulder.');
  process.exit();
};

seed();