
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
    const regNum = "22012972";

    console.log(`Checking for User Email: ${email}`);
    const user = await userRepository.findOne({ where: { email }, relations: ['profile'] });
    if (user) {
        console.log(`User found. Deleting...`);
        await userRepository.remove(user);
        console.log("User deleted.");
    } else {
        console.log("User not found.");
    }

    console.log(`Checking for Reg Num: ${regNum}`);
    const profile = await profileRepository.findOne({ where: { registration_number: regNum } });
    if (profile) {
        console.log(`Profile found for reg num. Deleting...`);
        await profileRepository.remove(profile);
        console.log("Profile deleted.");
    } else {
        console.log("Profile not found.");
    }

    await app.close();
}

bootstrap();
