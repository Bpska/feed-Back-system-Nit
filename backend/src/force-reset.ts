import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('--- STARTING FORCE RESET ---');
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        console.log('Deleting from ratings...');
        await queryRunner.query('DELETE FROM ratings');
        console.log('Deleting from faculty_assignments...');
        await queryRunner.query('DELETE FROM faculty_assignments');
        console.log('Deleting from faculty...');
        await queryRunner.query('DELETE FROM faculty');

        await queryRunner.commitTransaction();
        console.log('--- FORCE RESET SUCCESSFUL ---');
    } catch (err: any) {
        console.error('FORCE RESET FAILED!');
        console.error(err.message);
        await queryRunner.rollbackTransaction();
    } finally {
        await queryRunner.release();
        await app.close();
    }
}

bootstrap().catch(err => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
