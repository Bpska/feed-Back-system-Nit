import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Faculty } from './entities/faculty.entity';
import { FacultyAssignment } from './entities/faculty-assignment.entity';
import { Rating } from './entities/rating.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const facultyRepo = dataSource.getRepository(Faculty);
    const assignmentRepo = dataSource.getRepository(FacultyAssignment);
    const ratingRepo = dataSource.getRepository(Rating);

    console.log('--- STARTING FACULTY GRID POPULATION (DEEP CLEAN) ---');

    async function getFaculty(name: string): Promise<Faculty> {
        const formattedName = name.trim();
        // Try case-insensitive name match
        let faculty = await facultyRepo.createQueryBuilder('f')
            .where('LOWER(f.name) = LOWER(:name)', { name: formattedName })
            .getOne();

        const email = formattedName.toLowerCase().replace(/[^a-z]/g, '.') + '@nit.edu.in';

        if (!faculty) {
            // Try email match if name match failed
            faculty = await facultyRepo.findOne({ where: { email } });
        }

        if (!faculty) {
            faculty = facultyRepo.create({
                name: formattedName,
                email: email,
                department: 'General',
                designation: 'Professor'
            });
            await facultyRepo.save(faculty);
        }
        return faculty;
    }

    const mapping1AE = {
        'CHEM': { 'A': 'BIPIN BIHARI BHOI', 'B': 'BIPIN BIHARI BHOI', 'C': 'BIPIN BIHARI BHOI', 'D': 'BISWANATH BISWAL', 'E': 'BISWANATH BISWAL' },
        'MATH': { 'A': 'SWAPNITA MOHANTY', 'B': 'SOUBHAGINI MOHAPATRA', 'C': 'SOUBHAGINI MOHAPATRA', 'D': 'BANDANA SWAIN', 'E': 'RUDRA PRATAP JENA' },
        'BE': { 'A': 'SHYMALENDU KHUNTIA', 'B': 'SHYMALENDU KHUNTIA', 'C': 'JYOTIRMAYA SAMAL', 'D': 'JYOTIRMAYA SAMAL', 'E': 'RASHMI RANJAN TARAI' },
        'BME': { 'A': 'SATYABAN SAHOO', 'B': 'SATYABAN SAHOO', 'C': 'PRABIN KUMAR PATNAIK', 'D': 'SAMEER KUMAR PANDA', 'E': 'PRADYUMNA KUMAR DAS' },
        'PC': { 'A': 'BANI BHUSAN PRAHARAJ', 'B': 'NAROTTAM SAHOO', 'C': 'SAMPRITI PRADHAN', 'D': 'BISWABARA PANDA', 'E': 'SUNANDA SAHOO' },
        'UHV': { 'A': 'SUNITA MOHAPATRA', 'B': 'SUNITA MOHAPATRA', 'C': 'SUSHREE SWAG. MOHAPATRA', 'D': 'SUKANYA DEY', 'E': 'SUKANYA DEY' }
    };

    const mapping1FJ = {
        'PHYSICS': { 'F': 'MONALISHA PANDA', 'G': 'MONALISHA PANDA', 'H': 'MONALISHA PANDA', 'I': 'UMAKANTA DAS', 'J': 'UMAKANTA DAS' },
        'MATH': { 'F': 'RUDRA PRATAP JENA', 'G': 'SURESH CH. MOHAPATRA', 'H': 'SURESH CH. MOHAPATRA', 'I': 'SOUBHAGINI MOHAPATRA', 'J': 'ARJUN KUMAR PAUL' },
        'BEE': { 'F': 'BIKASH KUMAR SWAIN', 'G': 'PRADOSH RANJAN PARIDA', 'H': 'BIKASH KUMAR SWAIN', 'I': 'SUBHENDU MOHAN BASANTIA', 'J': 'SNIGDHA MADHUSMITA ROUT' },
        'EM': { 'F': 'SHAKTI PRASAD JENA', 'G': 'SAI SATYANANDA SAHOO', 'H': 'SHAKTI PRASAD JENA', 'I': 'SAI SATYANANDA SAHOO', 'J': 'SAI SATYANANDA SAHOO' },
        'BCE': { 'F': 'ABHIJIT CHHATAR', 'G': 'SIPRA MOHAPATRA', 'H': 'SOUMYA PRAKASH SAHOO', 'I': 'JHARNA PRADHAN', 'J': 'SOUMYA PRAKASH SAHOO' },
        'ETW': { 'F': 'SUNITA MOHAPATRA', 'G': 'SUNITA MOHAPATRA', 'H': 'SUSHREE SWAG. MOHAPATRA', 'I': 'SUKANYA DEY', 'J': 'SUKANYA DEY' }
    };

    const mapping2CSE = {
        'JAVA': { 'A': 'POOJARINI SAHU', 'B': 'PRIYADARSHINI SAMAL', 'C': 'PRIYADARSHINI SAMAL', 'D': 'DR. NAROTTAM SAHU', 'E': 'SAKTI CHARAN PANDA', 'F': 'DR. SUBHASHREE ROUT' },
        'DS': { 'A': 'DR. NAROTTAM SAHU', 'B': 'POOJARINI SAHU', 'C': 'SAMPRITI PRADHAN', 'D': 'RAJ KUMAR MISHRA', 'E': 'SAMPRITI PRADHAN', 'F': 'SWAGATIKA SAHOO' },
        'OB': { 'A': 'RITU PATTNAIK', 'B': 'RITU PATTNAIK', 'C': 'RITU PATTNAIK', 'D': 'SUBHAJIT RAUL', 'E': 'SUBHAJIT RAUL', 'F': 'SUBHAJIT RAUL' },
        'MATH': { 'A': 'SURESH MAHAPATRA', 'B': 'SURESH MAHAPATRA', 'C': 'BANDANA SWAIN', 'D': 'SWAPANITA MOHANTY', 'E': 'RUDRA PRATAP JENA', 'F': 'RUDRA PRATAP JENA' },
        'ACC-1': { 'A': 'JAYA JASMIN SAHOO', 'B': 'JAYA JASMIN SAHOO', 'C': 'APARNAA BABOO', 'D': 'SUMANTA KUMAR SINGH', 'E': 'APARNA MISHRA', 'F': 'SUMANTA KUMAR SINGH' },
        'DE': { 'A': 'SHYAMALENDU KHUNTIA', 'B': 'JYOTI RANJAN SAMAL', 'C': 'R. TARAI', 'D': 'R. TARAI', 'E': 'T. SAHOO', 'F': 'T. SAHOO' }
    };

    const mapping2ME = {
        'ETD': { 'A': 'Mr. MANAS KUMAR SAMANTARAY', 'B': 'Mr. MANAS KUMAR SAMANTARAY' },
        'MOS': { 'A': 'Mr. OM PRAKASH SAMAL', 'B': 'Mr. OM PRAKASH SAMAL' },
        'IPM&EM': { 'A': 'Mr. RAJESH KUMAR MALLIK', 'B': 'Mr. RAJESH KUMAR MALLIK' },
        'MATH-III': { 'A': 'Mrs. SWAPNITA MOHANTY', 'B': 'Mrs. SWAPNITA MOHANTY' },
        'EE': { 'A': 'Mr. SURYANARAYAN BISWAL', 'B': 'Mr. SURYANARAYAN BISWAL' },
        'ACC': { 'A': 'Mr. BANI BHUSAN PRAHARAJ', 'B': 'Mr. KARTICK SWAIN' }
    };

    const mapping1BCA = {
        'CP': { 'A': 'SUBHALAXMI DASH' },
        'PYTHON': { 'A': 'JAYA JASMINE SAHOO' },
        'CF': { 'A': 'SATISH PATTANAYAK' },
        'DLD': { 'A': 'TAMANNA SAHU' },
        'ES': { 'A': 'RITIK MANDAL' }
    };

    const mapping2BCA = {
        'DBMS': { 'A': 'PARESH KUMAR MALLIK' },
        'OS': { 'A': 'AYAKRUSHNA MOHANTY' },
        'COA': { 'A': 'SUBHALAXMI DASH' },
        'I & EP': { 'A': 'BARSHA PATTANAIK' },
        'POM': { 'A': 'JYOTI PRAKASH PANDA' },
        'OB': { 'A': 'DEEPIKA BEHERA' }
    };

    const mapping1MCA = {
        'CP': { 'A': 'GYANA PRAKASH BHUYA' },
        'DBMS': { 'A': 'SAKTI CHARAN PANDA' },
        'CN': { 'A': 'SWAGATIKA SAHOO' },
        'DLD': { 'A': 'RAKESH PATTNAYAK' },
        'CE': { 'A': 'SUSHREE SWAGATIKA' },
        'DM': { 'A': 'SURESH MOHAPATRA' }
    };

    async function processMapping(mapping: any, year: number, semester: number, branch: string) {
        console.log(`Processing mapping for Year ${year}, Sem ${semester}, Branch ${branch}...`);
        for (const [subject, subMapping] of Object.entries(mapping)) {
            for (const [section, facultyName] of Object.entries(subMapping as any)) {
                try {
                    const faculty = await getFaculty(facultyName as string);
                    const assignment = assignmentRepo.create({
                        faculty: faculty,
                        subject: subject,
                        year: year,
                        semester: semester,
                        section: section,
                        branch: branch
                    });
                    await assignmentRepo.save(assignment);
                    console.log(`[SUCCESS] Assigned ${faculty.name} to ${subject} (Sec ${section})`);
                } catch (err: any) {
                    console.error(`[ERROR] Failed to save assignment: ${subject} / ${section} / ${facultyName}`, err.message);
                }
            }
        }
    }

    // SKIP DEEP CLEAN - ALREADY HANDED BY force-reset.ts
    console.log('--- SKIPPING DEEP CLEAN (Already Done) ---');

    await processMapping(mapping1AE, 1, 1, 'CSE');
    await processMapping(mapping1FJ, 1, 1, 'CSE');
    await processMapping(mapping2CSE, 2, 3, 'CSE');
    await processMapping(mapping2ME, 2, 3, 'ME');
    await processMapping(mapping1BCA, 1, 1, 'BCA');
    await processMapping(mapping2BCA, 2, 3, 'BCA');
    await processMapping(mapping1MCA, 1, 1, 'MCA');

    console.log('--- GRID POPULATION COMPLETED ---');
    await app.close();
}

bootstrap().catch(err => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
