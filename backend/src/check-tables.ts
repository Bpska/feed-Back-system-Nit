
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get<DataSource>(getDataSourceToken());

    console.log("Checking for tables...");
    const tables = await dataSource.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log("Tables found:", tables.map(t => t.table_name));

    await app.close();
}

bootstrap();
