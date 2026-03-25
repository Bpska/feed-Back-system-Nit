import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { FacultyAssignment } from './entities/faculty-assignment.entity';
import { Rating } from './entities/rating.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const assignmentRepo = dataSource.getRepository(FacultyAssignment);
    const ratingRepo = dataSource.getRepository(Rating);

    console.log('--- CHECKING FOR RATINGS ON QUESTIONABLE ASSIGNMENTS ---');

    // Check for "peter" or "JAVA" in Yr 1
    const assignments = await assignmentRepo.find({
        where: [
            { subject: 'JAVA', year: 1 },
            { subject: 'Computer Programming', section: 'A' },
            { subject: 'UHV', section: 'A' }
        ],
        relations: ['faculty', 'ratings']
    });

    console.log(`Found ${assignments.length} potential duplicate/wrong assignments:`);
    for (const a of assignments) {
        console.log(`- ${a.subject} (${a.faculty.name}) [Yr ${a.year}, Sem ${a.semester}, Sec ${a.section}]: ${a.ratings.length} ratings`);
    }

    await app.close();
}

bootstrap().catch(err => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
