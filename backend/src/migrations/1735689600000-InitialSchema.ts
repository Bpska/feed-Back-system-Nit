import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1735689600000 implements MigrationInterface {
  name = 'InitialSchema1735689600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable necessary extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "email_confirmed" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("id")
      )
    `);

    // Create profiles table
    await queryRunner.query(`
      CREATE TABLE "profiles" (
        "id" uuid NOT NULL,
        "full_name" character varying NOT NULL,
        "registration_number" character varying NOT NULL,
        "branch" character varying NOT NULL,
        "year" integer NOT NULL CHECK (year BETWEEN 1 AND 4),
        "semester" integer NOT NULL CHECK (semester BETWEEN 1 AND 8),
        "section" character(1) NOT NULL CHECK (section IN ('A', 'B', 'C', 'D')),
        "phone_number" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"),
        CONSTRAINT "FK_8e520eb4da7dc01d0e190447c8e" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create faculty table
    await queryRunner.query(`
      CREATE TABLE "faculty" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "department" character varying NOT NULL,
        "designation" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_3f7ed6dd47a3e27c38dc9a6b6e6" PRIMARY KEY ("id")
      )
    `);

    // Create faculty_assignments table
    await queryRunner.query(`
      CREATE TABLE "faculty_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subject" character varying NOT NULL,
        "branch" character varying NOT NULL,
        "year" integer NOT NULL CHECK (year BETWEEN 1 AND 4),
        "semester" integer NOT NULL CHECK (semester BETWEEN 1 AND 8),
        "section" character(1) NOT NULL CHECK (section IN ('A', 'B', 'C', 'D')),
        "faculty_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c0e8b8b8b8b8b8b8b8b8b8b8b8" PRIMARY KEY ("id"),
        CONSTRAINT "FK_4c0e8b8b8b8b8b8b8b8b8b8b8b8" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_faculty_assignments" UNIQUE ("faculty_id", "year", "semester", "section", "branch", "subject")
      )
    `);

    // Create ratings table
    await queryRunner.query(`
      CREATE TABLE "ratings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "engagement_level" integer NOT NULL CHECK (engagement_level BETWEEN 1 AND 5),
        "concept_understanding" integer NOT NULL CHECK (concept_understanding BETWEEN 1 AND 5),
        "content_depth" integer NOT NULL CHECK (content_depth BETWEEN 1 AND 5),
        "application_teaching" integer NOT NULL CHECK (application_teaching BETWEEN 1 AND 5),
        "pedagogy_tools" integer NOT NULL CHECK (pedagogy_tools BETWEEN 1 AND 5),
        "communication_skills" integer NOT NULL CHECK (communication_skills BETWEEN 1 AND 5),
        "class_decorum" integer NOT NULL CHECK (class_decorum BETWEEN 1 AND 5),
        "teaching_aids" integer NOT NULL CHECK (teaching_aids BETWEEN 1 AND 5),
        "feedback_message" text,
        "student_id" uuid NOT NULL,
        "faculty_id" uuid NOT NULL,
        "assignment_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4ac22aafceac51918e9bfa9de3a" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ratings_student" FOREIGN KEY ("student_id") REFERENCES "profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ratings_faculty" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ratings_assignment" FOREIGN KEY ("assignment_id") REFERENCES "faculty_assignments"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_ratings_student_assignment" UNIQUE ("student_id", "assignment_id")
      )
    `);

    // Create user_roles table
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" character varying NOT NULL,
        "admin_code" character varying NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_user_roles_user_role" UNIQUE ("user_id", "role")
      )
    `);

    // Create messages table
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "message" text NOT NULL,
        "admin_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "read_at" TIMESTAMP,
        CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_student" FOREIGN KEY ("student_id") REFERENCES "profiles"("id") ON DELETE CASCADE
      )
    `);

    // Create hostel_ratings table
    await queryRunner.query(`
      CREATE TABLE "hostel_ratings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "accommodation_rooms" integer NOT NULL CHECK (accommodation_rooms BETWEEN 1 AND 5),
        "maintenance_facilities" integer NOT NULL CHECK (maintenance_facilities BETWEEN 1 AND 5),
        "medical_facilities" integer NOT NULL CHECK (medical_facilities BETWEEN 1 AND 5),
        "mess_food_quality" integer NOT NULL CHECK (mess_food_quality BETWEEN 1 AND 5),
        "safety_security" integer NOT NULL CHECK (safety_security BETWEEN 1 AND 5),
        "wifi_connectivity" integer NOT NULL CHECK (wifi_connectivity BETWEEN 1 AND 5),
        "washrooms_hygiene" integer NOT NULL CHECK (washrooms_hygiene BETWEEN 1 AND 5),
        "discipline_rules" integer NOT NULL CHECK (discipline_rules BETWEEN 1 AND 5),
        "hostel_staff_behaviour" integer NOT NULL CHECK (hostel_staff_behaviour BETWEEN 1 AND 5),
        "overall_living_experience" integer NOT NULL CHECK (overall_living_experience BETWEEN 1 AND 5),
        "feedback_message" text,
        "student_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hostel_ratings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_hostel_ratings_student" FOREIGN KEY ("student_id") REFERENCES "profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_hostel_ratings_student" UNIQUE ("student_id")
      )
    `);

    // Create app_settings table
    await queryRunner.query(`
      CREATE TABLE "app_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "setting_key" character varying NOT NULL,
        "setting_value" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_settings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_app_settings_key" UNIQUE ("setting_key")
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_profiles_registration_number" ON "profiles" ("registration_number")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_faculty_email" ON "faculty" ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "app_settings"`);
    await queryRunner.query(`DROP TABLE "hostel_ratings"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "ratings"`);
    await queryRunner.query(`DROP TABLE "faculty_assignments"`);
    await queryRunner.query(`DROP TABLE "faculty"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
