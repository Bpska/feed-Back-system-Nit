import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreateRatingDto {
  @IsNotEmpty()
  @IsString()
  assignment_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  engagement_level: number;

  @IsInt()
  @Min(1)
  @Max(5)
  concept_understanding: number;

  @IsInt()
  @Min(1)
  @Max(5)
  content_depth: number;

  @IsInt()
  @Min(1)
  @Max(5)
  application_teaching: number;

  @IsInt()
  @Min(1)
  @Max(5)
  pedagogy_tools: number;

  @IsInt()
  @Min(1)
  @Max(5)
  communication_skills: number;

  @IsInt()
  @Min(1)
  @Max(5)
  class_decorum: number;

  @IsInt()
  @Min(1)
  @Max(5)
  teaching_aids: number;

  @IsOptional()
  @IsString()
  feedback_message?: string;
}

export class CreateHostelRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  accommodation_rooms: number;

  @IsInt()
  @Min(1)
  @Max(5)
  maintenance_facilities: number;

  @IsInt()
  @Min(1)
  @Max(5)
  medical_facilities: number;

  @IsInt()
  @Min(1)
  @Max(5)
  mess_food_quality: number;

  @IsInt()
  @Min(1)
  @Max(5)
  safety_security: number;

  @IsInt()
  @Min(1)
  @Max(5)
  wifi_connectivity: number;

  @IsInt()
  @Min(1)
  @Max(5)
  washrooms_hygiene: number;

  @IsInt()
  @Min(1)
  @Max(5)
  discipline_rules: number;

  @IsInt()
  @Min(1)
  @Max(5)
  hostel_staff_behaviour: number;

  @IsInt()
  @Min(1)
  @Max(5)
  overall_living_experience: number;

  @IsOptional()
  @IsString()
  feedback_message?: string;
}

export class CreateFacultyAssignmentDto {
  @IsNotEmpty()
  @IsString()
  faculty_id: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  branch: string;

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
}
