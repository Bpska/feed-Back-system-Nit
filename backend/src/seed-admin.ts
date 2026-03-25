
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './modules/auth/auth.service';
import { RegisterDto } from './dto/auth.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const userRepository = app.get(getRepositoryToken(User));
    const userRoleRepository = app.get(getRepositoryToken(UserRole));

    const email = "bpskar2@gmail.com";
    const password = "123456789"; // Plain text, will hash
    const adminCode = "2025";

    console.log(`Checking for user ${email}...`);

    let user = await userRepository.findOne({ where: { email }, relations: ['userRoles'] });

    if (!user) {
        console.log("User not found. Creating...");
        const hashedPassword = await bcrypt.hash(password, 10);
        user = userRepository.create({
            email,
            password: hashedPassword,
            email_confirmed: true,
        });
        user = await userRepository.save(user);
        console.log("User created.");
    } else {
        console.log("User exists. Updating password...");
        user.password = await bcrypt.hash(password, 10);
        await userRepository.save(user);
        console.log("Password updated.");
    }

    // Check role
    const roles = await userRoleRepository.find({ where: { user: { id: user.id } } });
    const hasAdmin = roles.some(r => r.role === 'admin');

    if (!hasAdmin) {
        console.log("Adding admin role...");
        const role = userRoleRepository.create({
            user,
            role: 'admin',
            admin_code: adminCode
        });
        await userRoleRepository.save(role);
        console.log("Admin role added.");
    } else {
        console.log("Updating admin code for existing admin role...");
        const adminRole = roles.find(r => r.role === 'admin');
        if (adminRole) {
            adminRole.admin_code = adminCode;
            await userRoleRepository.save(adminRole);
            console.log("Admin code updated.");
        }
    }

    console.log("Done. You can login now.");
    await app.close();
}

bootstrap();
