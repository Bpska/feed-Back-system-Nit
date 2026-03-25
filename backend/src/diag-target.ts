import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { FacultyAssignment } from './entities/faculty-assignment.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const assignmentRepo = dataSource.getRepository(FacultyAssignment);

    console.log('--- DIAGNOSING SPECIFIC CRITERIA: Yr 1, Sem 1, Branch CSE, Section A ---');
    const assignments = await assignmentRepo.find({
        where: {
            year: 1,
            semester: 1,
            branch: 'CSE',
            section: 'A'
        },
        relations: ['faculty']
    });

    console.log(`Found ${assignments.length} assignments:`);
    assignments.forEach(a => {
        console.log(`- ${a.subject}: ${a.faculty.name}`);
    });

    await app.close();
}

bootstrap().catch(err => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
