import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from '../../entities/rating.entity';
import { HostelRating } from '../../entities/hostel-rating.entity';
import { FacultyAssignment } from '../../entities/faculty-assignment.entity';
import { Profile } from '../../entities/profile.entity';
import { Faculty } from '../../entities/faculty.entity';
import {
  CreateRatingDto,
  CreateHostelRatingDto,
  CreateFacultyAssignmentDto,
} from '../../dto/rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingRepository: Repository<Rating>,
    @InjectRepository(HostelRating)
    private hostelRatingRepository: Repository<HostelRating>,
    @InjectRepository(FacultyAssignment)
    private facultyAssignmentRepository: Repository<FacultyAssignment>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Faculty)
    private facultyRepository: Repository<Faculty>,
  ) { }

  async getFacultyAssignments(
    year?: number,
    semester?: number,
    branch?: string,
    section?: string,
  ): Promise<FacultyAssignment[]> {
    const query = this.facultyAssignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.faculty', 'faculty')
      .leftJoinAndSelect('assignment.ratings', 'ratings');

    if (year) query.andWhere('assignment.year = :year', { year });
    if (semester)
      query.andWhere('assignment.semester = :semester', { semester });
    if (branch) query.andWhere('assignment.branch = :branch', { branch });
    if (section) query.andWhere('assignment.section = :section', { section });

    return query.getMany();
  }

  async createRating(
    userId: string,
    createRatingDto: CreateRatingDto,
  ): Promise<Rating> {
    // Check if rating already exists for this student and assignment
    const existingRating = await this.ratingRepository.findOne({
      where: {
        student: { id: userId },
        assignment: { id: createRatingDto.assignment_id },
      },
    });

    if (existingRating) {
      throw new ConflictException('Rating already exists for this assignment');
    }

    // Verify assignment exists
    const assignment = await this.facultyAssignmentRepository.findOne({
      where: { id: createRatingDto.assignment_id },
      relations: ['faculty'],
    });

    if (!assignment) {
      throw new NotFoundException('Faculty assignment not found');
    }

    const rating = this.ratingRepository.create({
      ...createRatingDto,
      student: { id: userId },
      faculty: { id: assignment.faculty.id },
      assignment: { id: createRatingDto.assignment_id },
    });

    return this.ratingRepository.save(rating);
  }

  async getStudentRatings(userId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { student: { id: userId } },
      relations: ['faculty', 'assignment'],
    });
  }

  async getFacultyRatings(
    facultyId: string,
    semester?: number,
    section?: string,
    branch?: string,
  ): Promise<Rating[]> {
    const query = this.ratingRepository
      .createQueryBuilder('rating')
      .leftJoinAndSelect('rating.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('rating.assignment', 'assignment')
      .where('rating.faculty_id = :facultyId', { facultyId });

    if (semester) {
      query.andWhere('assignment.semester = :semester', { semester });
    }

    if (section && section !== 'all') {
      query.andWhere('assignment.section = :section', { section });
    }

    if (branch && branch !== 'all') {
      query.andWhere('assignment.branch = :branch', { branch });
    }

    return query.getMany();
  }

  async createHostelRating(
    userId: string,
    createHostelRatingDto: CreateHostelRatingDto,
  ): Promise<HostelRating> {
    // Check if hostel rating already exists for this student
    const existingRating = await this.hostelRatingRepository.findOne({
      where: { student: { id: userId } },
    });

    if (existingRating) {
      // Update existing rating
      Object.assign(existingRating, createHostelRatingDto);
      return this.hostelRatingRepository.save(existingRating);
    }

    const rating = this.hostelRatingRepository.create({
      ...createHostelRatingDto,
      student: { id: userId },
    });

    return this.hostelRatingRepository.save(rating);
  }

  async getHostelRating(userId: string): Promise<HostelRating | null> {
    return this.hostelRatingRepository.findOne({
      where: { student: { id: userId } },
    });
  }

  async createFacultyAssignment(
    createFacultyAssignmentDto: CreateFacultyAssignmentDto,
  ): Promise<FacultyAssignment> {
    // Verify faculty exists
    const faculty = await this.facultyRepository.findOne({
      where: { id: createFacultyAssignmentDto.faculty_id },
    });

    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    const assignment = this.facultyAssignmentRepository.create({
      ...createFacultyAssignmentDto,
      faculty: { id: createFacultyAssignmentDto.faculty_id },
    });

    return this.facultyAssignmentRepository.save(assignment);
  }

  async getAllFacultyAssignments(): Promise<FacultyAssignment[]> {
    return this.facultyAssignmentRepository.find({
      relations: ['faculty'],
    });
  }

  async getAssignmentRatings(assignmentId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { assignment: { id: assignmentId } },
      relations: ['student'],
    });
  }
  async getAllRatings(): Promise<Rating[]> {
    return this.ratingRepository.find({
      relations: ['student', 'assignment', 'faculty', 'assignment.faculty'],
    });
  }

  async getAllHostelRatings(): Promise<HostelRating[]> {
    return this.hostelRatingRepository.find({
      relations: ['student', 'student.user'],
      order: { created_at: 'DESC' },
    });
  }

  async updateFacultyAssignment(
    id: string,
    updateDto: Partial<CreateFacultyAssignmentDto>,
  ): Promise<FacultyAssignment> {
    const assignment = await this.facultyAssignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException('Faculty assignment not found');
    }

    Object.assign(assignment, updateDto);
    return this.facultyAssignmentRepository.save(assignment);
  }

  async deleteHostelRating(id: string): Promise<void> {
    const result = await this.hostelRatingRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Hostel rating not found');
    }
  }

  async deleteAllFacultyRatings(facultyId: string): Promise<void> {
    const faculty = await this.facultyRepository.findOne({
      where: { id: facultyId },
    });

    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    await this.ratingRepository.delete({ faculty: { id: facultyId } });
  }

  async bulkDeleteHostelRatings(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.hostelRatingRepository.delete(ids);
  }
}
