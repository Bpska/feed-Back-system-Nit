
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get<DataSource>(getDataSourceToken());

    console.log("Dropping profiles table...");
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.query('DROP TABLE IF EXISTS "profiles" CASCADE');
    console.log("Dropped.");

    await app.close();
}

bootstrap();
