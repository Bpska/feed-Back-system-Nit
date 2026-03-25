import { IsEmail, IsNotEmpty, IsString, MinLength, IsInt, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(7)
  password: string;

  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsString()
  registration_number: string;

  @IsNotEmpty()
  @IsString()
  branch: string;

  @IsInt()
  year: number;

  @IsInt()
  semester: number;

  @IsNotEmpty()
  @IsString()
  section: string;

  phone_number?: string;
}

export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    profile: any;
    roles?: any[];
  };
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(7)
  newPassword: string;

  @IsOptional()
  @IsString()
  token?: string;
}
