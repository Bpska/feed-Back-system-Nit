import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailToProfileAndFixConstraints1735689600001
    implements MigrationInterface {
    name = 'AddEmailToProfileAndFixConstraints1735689600001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add email column to profiles
        await queryRunner.query(
            `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email" character varying`,
        );

        // Update existing profiles with user email if missing
        await queryRunner.query(
            `UPDATE "profiles" p SET "email" = u."email" FROM "users" u WHERE p."id" = u."id" AND p."email" IS NULL`,
        );

        // Make email column NOT NULL after populating
        await queryRunner.query(
            `ALTER TABLE "profiles" ALTER COLUMN "email" SET NOT NULL`,
        );

        // Drop and recreate section constraints for profiles
        // We need to find the constraint name first. Since it was inline, it's usually table_column_check
        await queryRunner.query(
            `ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_section_check"`,
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" ADD CONSTRAINT "profiles_section_check" CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'))`,
        );

        // Drop and recreate section constraints for faculty_assignments
        await queryRunner.query(
            `ALTER TABLE "faculty_assignments" DROP CONSTRAINT IF EXISTS "faculty_assignments_section_check"`,
        );
        await queryRunner.query(
            `ALTER TABLE "faculty_assignments" ADD CONSTRAINT "faculty_assignments_section_check" CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert section constraints
        await queryRunner.query(
            `ALTER TABLE "faculty_assignments" DROP CONSTRAINT IF EXISTS "faculty_assignments_section_check"`,
        );
        await queryRunner.query(
            `ALTER TABLE "faculty_assignments" ADD CONSTRAINT "faculty_assignments_section_check" CHECK (section IN ('A', 'B', 'C', 'D'))`,
        );

        await queryRunner.query(
            `ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_section_check"`,
        );
        await queryRunner.query(
            `ALTER TABLE "profiles" ADD CONSTRAINT "profiles_section_check" CHECK (section IN ('A', 'B', 'C', 'D'))`,
        );

        // Remove email column
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "email"`);
    }
}
