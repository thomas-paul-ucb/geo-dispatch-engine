import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './driver.entity';
import { Logger } from '@nestjs/common';

@Processor('dispatch')
export class DriversProcessor extends WorkerHost {
  private readonly logger = new Logger(DriversProcessor.name);

  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'ride-timeout') {
      const { driverId } = job.data;
      
      const driver = await this.driversRepository.findOne({ where: { id: driverId } });
      
      // If driver is still BUSY, they probably didn't finish the ride. Reset them.
      if (driver && driver.status === DriverStatus.BUSY) {
        driver.status = DriverStatus.AVAILABLE;
        await this.driversRepository.save(driver);
        this.logger.warn(`TIMEOUT: Driver ${driverId} was stuck in BUSY status. Reset to AVAILABLE.`);
      }
    }
  }
}