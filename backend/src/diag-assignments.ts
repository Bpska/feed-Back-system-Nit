import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { FacultyAssignment } from './entities/faculty-assignment.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const assignmentRepo = dataSource.getRepository(FacultyAssignment);

    console.log('--- DIAGNOSING SECTION A ASSIGNMENTS ---');
    const assignments = await assignmentRepo.find({
        where: { section: 'A' },
        relations: ['faculty']
    });

    console.log(`Found ${assignments.length} assignments for Section A:`);
    assignments.forEach(a => {
        console.log(`- [Yr ${a.year}, Sem ${a.semester}, Branch ${a.branch}] ${a.subject}: ${a.faculty.name} (ID: ${a.id})`);
    });

    await app.close();
}

bootstrap().catch(err => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
