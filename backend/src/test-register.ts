
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './modules/auth/auth.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);

    const registerDto = {
        email: "test_reg_fails@gmail.com",
        password: "password123",
        full_name: "Test User",
        registration_number: "REG12345",
        branch: "CSE",
        year: 1,
        semester: 1,
        section: "A",
        phone_number: "1234567890"
    } as any;

    try {
        console.log("Attempting to register user...");
        const result = await authService.register(registerDto);
        console.log("Registration successful:", result);
    } catch (err) {
        console.error("Registration FAILED with error:");
        console.error(err);
        if (err.response) {
            console.error("Error Response:", err.response);
        }
    }

    await app.close();
}

bootstrap();
