import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { FacultyAssignment } from './entities/faculty-assignment.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        console.log('--- STARTING BBA TO BCA MIGRATION ---');

        // 1. Update Student Profiles
        console.log('Updating Profiles...');
        const profileResult = await queryRunner.manager
            .createQueryBuilder()
            .update(Profile)
            .set({ branch: 'BCA' })
            .where('branch = :oldBranch', { oldBranch: 'BBA' })
            .execute();
        console.log(`Updated ${profileResult.affected || 0} student profiles.`);

        // 2. Update Faculty Assignments
        console.log('Updating Faculty Assignments...');
        const assignmentResult = await queryRunner.manager
            .createQueryBuilder()
            .update(FacultyAssignment)
            .set({ branch: 'BCA' })
            .where('branch = :oldBranch', { oldBranch: 'BBA' })
            .execute();
        console.log(`Updated ${assignmentResult.affected || 0} faculty assignments.`);

        await queryRunner.commitTransaction();
        console.log('\n--- MIGRATION COMPLETED SUCCESSFULLY ---');
    } catch (err: any) {
        await queryRunner.rollbackTransaction();
        console.error('\n--- MIGRATION FAILED (TRANSACTION ROLLED BACK) ---');
        console.error('Error:', err.message);
    } finally {
        await queryRunner.release();
        await app.close();
    }
}

bootstrap();
