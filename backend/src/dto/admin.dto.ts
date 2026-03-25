import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class BulkImportStudentDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsString()
  registration_number: string;

  @IsInt()
  @Min(1)
  @Max(4)
  year: number;

  @IsInt()
  @Min(1)
  @Max(8)
  semester: number;

  @IsNotEmpty()
  @IsString()
  section: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsNotEmpty()
  @IsString()
  branch: string;
}

export class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  admin_code: string;
}

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  student_id: string;
}
