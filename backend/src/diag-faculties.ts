import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Faculty } from './entities/faculty.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const facultyRepo = dataSource.getRepository(Faculty);

    const faculties = await facultyRepo.find();
    const nameMap = new Map<string, string[]>();

    faculties.forEach(f => {
        const lowerName = f.name.toLowerCase().trim();
        if (!nameMap.has(lowerName)) {
            nameMap.set(lowerName, []);
        }
        nameMap.get(lowerName)!.push(`${f.name} (ID: ${f.id}, Email: ${f.email})`);
    });

    console.log('--- DUPLICATE FACULTY CHECK ---');
    for (const [name, list] of nameMap.entries()) {
        if (list.length > 1) {
            console.log(`Potential Duplicates for "${name}":`);
            list.forEach(item => console.log(`  - ${item}`));
        }
    }

    await app.close();
}

bootstrap().catch(err => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
