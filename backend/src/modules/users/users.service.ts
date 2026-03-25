import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../entities/profile.entity';
import { Faculty } from '../../entities/faculty.entity';
import { Rating } from '../../entities/rating.entity';
import { FacultyAssignment } from '../../entities/faculty-assignment.entity';
import {
  UpdateProfileDto,
  CreateFacultyDto,
  UpdateFacultyDto,
} from '../../dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Faculty)
    private facultyRepository: Repository<Faculty>,
    @InjectRepository(Rating)
    private ratingRepository: Repository<Rating>,
    @InjectRepository(FacultyAssignment)
    private facultyAssignmentRepository: Repository<FacultyAssignment>,
  ) { }

  async getProfile(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.getProfile(userId);

    Object.assign(profile, updateProfileDto);
    return this.profileRepository.save(profile);
  }

  async getAllFaculty(): Promise<Faculty[]> {
    return this.facultyRepository.find({
      relations: ['assignments'],
    });
  }

  async getFacultyById(id: string): Promise<Faculty> {
    const faculty = await this.facultyRepository.findOne({
      where: { id },
      relations: ['assignments'],
    });

    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    return faculty;
  }

  async createFaculty(createFacultyDto: CreateFacultyDto): Promise<Faculty> {
    const faculty = this.facultyRepository.create(createFacultyDto);
    return this.facultyRepository.save(faculty);
  }

  async updateFaculty(
    id: string,
    updateFacultyDto: UpdateFacultyDto,
  ): Promise<Faculty> {
    const faculty = await this.getFacultyById(id);

    Object.assign(faculty, updateFacultyDto);
    return this.facultyRepository.save(faculty);
  }

  async deleteFaculty(id: string): Promise<void> {
    const faculty = await this.getFacultyById(id);

    // Manually delete related data since CASCADE might not be active in DB
    await this.ratingRepository.delete({ faculty: { id } });
    await this.facultyAssignmentRepository.delete({ faculty: { id } });

    await this.facultyRepository.remove(faculty);
  }
}
