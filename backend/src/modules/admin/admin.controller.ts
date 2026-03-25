import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Profile } from '../../entities/profile.entity';
import { AdminService, AdminUser } from './admin.service';
import { BulkImportStudentDto, SendMessageDto, AdminLoginDto } from '../../dto/admin.dto';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
  };
}

interface AuthenticatedUser {
  id: string;
  email: string;
}

import { AuthService } from '../auth/auth.service';
import { AuthResponseDto } from '../../dto/auth.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) { }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async adminLogin(
    @Request() req: { user: AuthenticatedUser },
    @Body() adminLoginDto: AdminLoginDto,
  ): Promise<AuthResponseDto> {
    const user = await this.adminService.validateAdminRole(
      req.user.id,
      adminLoginDto.admin_code,
    );
    return this.authService.loginWithUser(user);
  }

  @Post('bulk-import-students')
  async bulkImportStudents(
    @Body() bulkImportDto: { students: BulkImportStudentDto[] },
  ) {
    return this.adminService.bulkImportStudents(bulkImportDto.students);
  }

  @Get('students-with-emails')
  async getStudentsWithEmails() {
    return this.adminService.getStudentsWithEmails();
  }

  @Delete('students/:studentId')
  async deleteStudent(@Param('studentId') studentId: string) {
    return this.adminService.deleteStudent(studentId);
  }

  @Put('students/:studentId')
  async updateStudent(
    @Param('studentId') studentId: string,
    @Body() updateData: Partial<Profile>,
  ) {
    return this.adminService.updateStudent(studentId, updateData);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  async sendMessageToStudent(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.sendMessageToStudent(
      sendMessageDto,
      req.user.userId,
    );
  }

  @Get('messages/:studentId')
  async getStudentMessages(@Param('studentId') studentId: string) {
    return this.adminService.getStudentMessages(studentId);
  }

  @Post('messages/:messageId/read')
  async markMessageAsRead(@Param('messageId') messageId: string) {
    return this.adminService.markMessageAsRead(messageId);
  }
  @Post('send-faculty-report')
  async sendFacultyReport(@Body() body: { facultyId: string; message: string; facultyEmail: string }) {
    // Placeholder for email sending service
    // In production, integrate with nodemailer or similar
    return { success: true, message: 'Report sent successfully' };
  }
}
