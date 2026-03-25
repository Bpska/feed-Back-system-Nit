import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { Rating } from '../../entities/rating.entity';
import { HostelRating } from '../../entities/hostel-rating.entity';
import { FacultyAssignment } from '../../entities/faculty-assignment.entity';
import { Profile } from '../../entities/profile.entity';
import { Faculty } from '../../entities/faculty.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rating,
      HostelRating,
      FacultyAssignment,
      Profile,
      Faculty,
    ]),
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
