import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { FacultyAssignment } from './entities/faculty-assignment.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const ratingRepo = dataSource.getRepository(Rating);
    const assignmentRepo = dataSource.getRepository(FacultyAssignment);

    console.log('--- STARTING CLEANUP TEST ---');
    try {
        console.log('Deleting all ratings...');
        const rCount = await ratingRepo.count();
        console.log(`Current rating count: ${rCount}`);
        await ratingRepo.delete({});
        console.log('Ratings deleted.');

        console.log('Deleting all assignments...');
        const aCount = await assignmentRepo.count();
        console.log(`Current assignment count: ${aCount}`);
        await assignmentRepo.delete({});
        console.log('Assignments deleted.');
    } catch (err: any) {
        console.error('Cleanup failed!');
        console.error(err.message);
        if (err.detail) console.error('Detail:', err.detail);
    }
    await app.close();
}

bootstrap().catch(err => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
