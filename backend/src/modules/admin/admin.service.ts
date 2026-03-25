import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Profile } from '../../entities/profile.entity';
import { UserRole } from '../../entities/user-role.entity';
import { Message } from '../../entities/message.entity';
import { BulkImportStudentDto, SendMessageDto } from '../../dto/admin.dto';

export interface AdminUser {
  id: string;
  email: string;
  profile: Profile;
  userRoles: UserRole[];
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) { }

  async validateAdmin(
    email: string,
    password: string,
    adminCode: string,
  ): Promise<AdminUser> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile', 'userRoles'],
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (!user || !(await (bcrypt as any).compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const adminRole = user.userRoles.find(
      (role) => role.role === 'admin' && role.admin_code === adminCode,
    );
    if (!adminRole) {
      throw new UnauthorizedException('Not an admin or invalid admin code');
    }

    return user;
  }

  async validateAdminRole(userId: string, adminCode: string): Promise<AdminUser> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'userRoles'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const adminRole = user.userRoles.find(
      (role) => role.role === 'admin' && role.admin_code === adminCode,
    );
    if (!adminRole) {
      throw new UnauthorizedException('Not an admin or invalid admin code');
    }

    return user;
  }

  async bulkImportStudents(students: BulkImportStudentDto[]): Promise<{
    success: boolean;
    imported: number;
    failed: number;
    results: { email: string; success: boolean }[];
    errors: { email: string; error: string }[];
  }> {
    const results: { email: string; success: boolean }[] = [];
    const errors: { email: string; error: string }[] = [];

    for (const student of students) {
      try {
        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
          where: { email: student.email },
        });

        if (existingUser) {
          errors.push({ email: student.email, error: 'User already exists' });
          continue;
        }

        // Check if registration number already exists
        const existingProfile = await this.profileRepository.findOne({
          where: { registration_number: student.registration_number },
        });

        if (existingProfile) {
          errors.push({
            email: student.email,
            error: 'Registration number already exists',
          });
          continue;
        }

        // Hash password
        const saltRounds = 10;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const hashedPassword: string = await (bcrypt as any).hash(
          student.password,
          saltRounds,
        );

        // Create user
        const user = this.userRepository.create({
          email: student.email,
          password: hashedPassword,
          email_confirmed: true,
        });

        const savedUser = await this.userRepository.save(user);

        // Create profile
        const profile = this.profileRepository.create({
          id: savedUser.id,
          full_name: student.full_name,
          registration_number: student.registration_number,
          email: student.email,
          branch: student.branch,
          year: student.year,
          semester: student.semester,
          section: student.section,
          phone_number: student.phone_number,
        });

        await this.profileRepository.save(profile);

        results.push({ email: student.email, success: true });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push({ email: student.email, error: errorMessage });
      }
    }

    return {
      success: true,
      imported: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  async getStudentsWithEmails(): Promise<
    {
      id: string;
      full_name: string;
      email: string;
      registration_number: string;
      branch: string;
      year: number;
      semester: number;
      section: string;
    }[]
  > {
    const profiles = await this.profileRepository.find({
      relations: ['user'],
    });

    return profiles.map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.user.email,
      registration_number: profile.registration_number,
      branch: profile.branch,
      year: profile.year,
      semester: profile.semester,
      section: profile.section,
    }));
  }

  async deleteStudent(studentId: string): Promise<void> {
    const profile = await this.profileRepository.findOne({
      where: { id: studentId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Student not found');
    }

    // Delete profile first (cascade will handle user)
    await this.profileRepository.remove(profile);
  }

  async updateStudent(studentId: string, updateData: Partial<Profile>): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { id: studentId },
    });

    if (!profile) {
      throw new NotFoundException('Student not found');
    }

    Object.assign(profile, updateData);
    return this.profileRepository.save(profile);
  }

  async sendMessageToStudent(
    sendMessageDto: SendMessageDto,
    adminId: string,
  ): Promise<Message> {
    const message = this.messageRepository.create({
      message: sendMessageDto.message,
      student: { id: sendMessageDto.student_id },
      admin_id: adminId,
    });

    return this.messageRepository.save(message);
  }

  async getStudentMessages(studentId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { student: { id: studentId } },
      order: { created_at: 'DESC' },
    });
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await this.messageRepository.update(messageId, { read_at: new Date() });
  }
}
