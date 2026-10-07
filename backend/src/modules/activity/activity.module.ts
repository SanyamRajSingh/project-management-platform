import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityController } from './controllers/activity.controller';
import { ActivityService } from './services/activity.service';
import { ActivityRepository } from './repositories/activity.repository';
import { ActivityListener } from './listeners/activity.listener';
import { Activity } from './entities/activity.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Organization, User])],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityRepository, ActivityListener],
  exports: [ActivityService],
})
export class ActivityModule {}
