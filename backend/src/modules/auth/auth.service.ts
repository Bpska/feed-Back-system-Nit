import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Profile } from '../../entities/profile.entity';
import { LoginDto, RegisterDto, AuthResponseDto, ForgotPasswordDto, ResetPasswordDto } from '../../dto/auth.dto';

interface UserWithoutPassword {
  id: string;
  email: string;
  profile: Profile;
  userRoles: any[];
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) { }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile', 'userRoles'],
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (user && (await (bcrypt as any).compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result as UserWithoutPassword;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        roles: user.userRoles,
      },
    };
  }

  async loginWithUser(user: UserWithoutPassword): Promise<AuthResponseDto> {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        roles: user.userRoles || [],
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Check if registration number already exists
      const existingProfile = await this.profileRepository.findOne({
        where: { registration_number: registerDto.registration_number },
      });

      if (existingProfile) {
        throw new ConflictException('Registration number already exists');
      }

      // Hash password
      const saltRounds = 10;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const hashedPassword: string = await (bcrypt as any).hash(
        registerDto.password,
        saltRounds,
      );

      // Create user
      const user = this.userRepository.create({
        email: registerDto.email,
        password: hashedPassword,
        email_confirmed: true, // For simplicity, auto-confirm
      });

      // Save user within transaction
      const savedUser = await queryRunner.manager.save(user);

      // Create profile
      const profile = this.profileRepository.create({
        id: savedUser.id, // Same ID as user
        full_name: registerDto.full_name,
        registration_number: registerDto.registration_number,
        email: registerDto.email,
        branch: registerDto.branch,
        year: registerDto.year,
        semester: registerDto.semester,
        section: registerDto.section,
        phone_number: registerDto.phone_number,
      });

      // Save profile within transaction
      await queryRunner.manager.save(profile);

      await queryRunner.commitTransaction();

      const payload = { email: savedUser.email, sub: savedUser.id };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: savedUser.id,
          email: savedUser.email,
          profile: profile,
          roles: [],
        },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Simplified: No token needed as requested. Just inform the user to proceed.
    return { message: 'User verified. You can now reset the password.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: resetPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Simplified reset: no token validation as requested by user

    // Hash new password
    const saltRounds = 10;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = await (bcrypt as any).hash(resetPasswordDto.newPassword, saltRounds);

    user.password = hashedPassword;
    await this.userRepository.save(user);

    return { message: 'Password has been reset successfully' };
  }
}
