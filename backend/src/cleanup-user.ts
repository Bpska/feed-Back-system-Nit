
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const userRepository = app.get(getRepositoryToken(User));

    const email = "hello@gmail.com";

    console.log(`Finding user: ${email}...`);
    const user = await userRepository.findOne({ where: { email }, relations: ['profile', 'userRoles'] });

    if (user) {
        console.log(`User found (ID: ${user.id}). Deleting...`);
        await userRepository.remove(user);
        console.log("User deleted successfully.");
    } else {
        console.log("User not found. Nothing to delete.");
    }

    await app.close();
}

bootstrap();
