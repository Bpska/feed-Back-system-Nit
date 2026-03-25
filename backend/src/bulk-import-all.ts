import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { Faculty } from './entities/faculty.entity';
import { FacultyAssignment } from './entities/faculty-assignment.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepository = app.get(getRepositoryToken(User));
    const profileRepository = app.get(getRepositoryToken(Profile));
    const facultyRepository = app.get(getRepositoryToken(Faculty));
    const assignmentRepository = app.get(getRepositoryToken(FacultyAssignment));

    const rootPath = path.join(__dirname, '../../');
    const studentCsvPath = path.join(rootPath, 'profiles-export-2025-12-23_18-22-08.csv');
    const facultyCsvPath = path.join(rootPath, 'faculty-export-2025-12-23_18-23-35.csv');
    const assignmentCsvPath = path.join(rootPath, 'faculty_assignments-export-2025-12-23_18-26-38.csv');

    const defaultPassword = '1234567';
    const saltRounds = 10;
    const hashedDefaultPassword = await bcrypt.hash(defaultPassword, saltRounds);

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        console.log('--- STARTING BULK IMPORT WITH ENHANCED DEDUPLICATION ---');

        // 1. IMPORT FACULTY
        console.log('Importing Faculty...');
        const facultyContent = fs.readFileSync(facultyCsvPath, 'utf-8');
        const facultyRecords = parse(facultyContent, {
            columns: true,
            skip_empty_lines: true,
            delimiter: ';',
        }) as any[];

        let facultyCount = 0;
        let facultySkipped = 0;
        const seenEmails = new Set<string>();

        for (const record of facultyRecords) {
            // Check if ID already exists
            const existingById = await queryRunner.manager.findOne(Faculty, { where: { id: record.id } });
            if (existingById) {
                facultySkipped++;
                continue;
            }

            // Check if Email already exists or seen in this batch
            const email = record.email.trim().toLowerCase();
            const existingByEmail = await queryRunner.manager.findOne(Faculty, { where: { email: email } });
            if (existingByEmail || seenEmails.has(email)) {
                console.log(`Skipping faculty ${record.name} due to duplicate email: ${email}`);
                facultySkipped++;
                continue;
            }

            const faculty = facultyRepository.create({
                id: record.id,
                name: record.name,
                email: email,
                department: record.department,
                designation: record.designation,
            });
            await queryRunner.manager.save(faculty);
            seenEmails.add(email);
            facultyCount++;
        }
        console.log(`Successfully imported ${facultyCount} faculty entries (Skipped ${facultySkipped} duplicates).`);

        // 2. IMPORT FACULTY ASSIGNMENTS
        console.log('Importing Faculty Assignments...');
        const assignmentContent = fs.readFileSync(assignmentCsvPath, 'utf-8');
        const assignmentRecords = parse(assignmentContent, {
            columns: true,
            skip_empty_lines: true,
            delimiter: ';',
        }) as any[];

        let assignmentCount = 0;
        let assignmentSkipped = 0;
        for (const record of assignmentRecords) {
            // Check if ID already exists
            const existingAssignment = await queryRunner.manager.findOne(FacultyAssignment, { where: { id: record.id } });
            if (existingAssignment) {
                assignmentSkipped++;
                continue;
            }

            // Verify Faculty exists
            const facultyExists = await queryRunner.manager.findOne(Faculty, { where: { id: record.faculty_id } });
            if (!facultyExists) {
                console.warn(`Warning: Faculty ID ${record.faculty_id} not found for assignment ${record.id}. Skipping.`);
                assignmentSkipped++;
                continue;
            }

            const assignment = assignmentRepository.create({
                id: record.id,
                faculty: { id: record.faculty_id },
                year: parseInt(record.year),
                semester: parseInt(record.semester),
                section: record.section,
                branch: record.branch,
                subject: record.subject,
            });
            await queryRunner.manager.save(assignment);
            assignmentCount++;
        }
        console.log(`Successfully imported ${assignmentCount} assignments (Skipped ${assignmentSkipped} missing/existing).`);

        // 3. IMPORT STUDENTS (Profiles + Users)
        console.log('Importing Students...');
        const studentContent = fs.readFileSync(studentCsvPath, 'utf-8');
        const studentRecords = parse(studentContent, {
            columns: true,
            skip_empty_lines: true,
            delimiter: ';',
        }) as any[];

        let studentCount = 0;
        let studentSkipped = 0;
        for (const record of studentRecords) {
            // Check if Registration Number already exists in Profile
            const regNum = record.registration_number.trim();
            const existingProfile = await queryRunner.manager.findOne(Profile, { where: { registration_number: regNum } });
            if (existingProfile) {
                studentSkipped++;
                continue;
            }

            const email = `${regNum}@nit.edu.in`.toLowerCase();

            // Check if email already exists in User
            const existingUser = await queryRunner.manager.findOne(User, { where: { email: email } });
            if (existingUser) {
                studentSkipped++;
                continue;
            }

            // Create User
            const user = userRepository.create({
                email: email,
                password: hashedDefaultPassword,
                email_confirmed: true,
            });
            const savedUser = await queryRunner.manager.save(user);

            // Create Profile
            const profile = profileRepository.create({
                id: savedUser.id,
                full_name: record.full_name,
                registration_number: regNum,
                email: email,
                branch: record.branch,
                year: parseInt(record.year),
                semester: parseInt(record.semester),
                section: record.section,
                phone_number: record.phone_number || null,
            });
            await queryRunner.manager.save(profile);
            studentCount++;
        }
        console.log(`Successfully imported ${studentCount} students (Skipped ${studentSkipped} existing).`);

        await queryRunner.commitTransaction();
        console.log('\n--- BULK IMPORT COMPLETED SUCCESSFULLY ---');
    } catch (err: any) {
        await queryRunner.rollbackTransaction();
        console.error('\n--- BULK IMPORT FAILED (TRANSACTION ROLLED BACK) ---');
        console.error('Error:', err.message);
    } finally {
        await queryRunner.release();
        await app.close();
    }
}

bootstrap();
