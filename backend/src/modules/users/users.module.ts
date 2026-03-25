import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Profile } from '../../entities/profile.entity';
import { Faculty } from '../../entities/faculty.entity';
import { Rating } from '../../entities/rating.entity';
import { FacultyAssignment } from '../../entities/faculty-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Faculty, Rating, FacultyAssignment])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
