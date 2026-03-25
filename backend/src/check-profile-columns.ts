
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get<DataSource>(getDataSourceToken());

    console.log("Checking columns for profiles...");
    const columns = await dataSource.query(`
    SELECT column_name, data_type, column_default, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'profiles'
  `);
    console.table(columns);

    await app.close();
}

bootstrap();
