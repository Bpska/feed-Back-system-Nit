
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const userRepository = app.get(getRepositoryToken(User));
    const profileRepository = app.get(getRepositoryToken(Profile));

    const email = "hello@gmail.com";
    const regNum = "01";

    console.log(`Checking for User Email: ${email}`);
    const user = await userRepository.findOne({ where: { email } });
    console.log(user ? `User FOUND (ID: ${user.id})` : "User NOT FOUND");

    console.log(`Checking for Registration Number: ${regNum}`);
    const profile = await profileRepository.findOne({ where: { registration_number: regNum } });
    console.log(profile ? "Profile/RegNum FOUND" : "Profile/RegNum NOT FOUND");

    await app.close();
}

bootstrap();
