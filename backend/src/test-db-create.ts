
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get<DataSource>(getDataSourceToken());

    try {
        console.log("Attempting to create test table...");
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.query('CREATE TABLE IF NOT EXISTS test_permissions (id serial primary key)');
        console.log("Table created.");
        await queryRunner.query('DROP TABLE test_permissions');
        console.log("Table dropped.");
    } catch (e) {
        console.error("Error:", e);
    }

    await app.close();
}

bootstrap();
