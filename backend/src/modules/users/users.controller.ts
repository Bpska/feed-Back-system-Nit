import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  CreateFacultyDto,
  UpdateFacultyDto,
} from '../../dto/user.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Put('profile')
  updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Get('faculty')
  getAllFaculty() {
    return this.usersService.getAllFaculty();
  }

  @Get('faculty/:id')
  getFacultyById(@Param('id') id: string) {
    return this.usersService.getFacultyById(id);
  }

  @Post('faculty')
  createFaculty(@Body() createFacultyDto: CreateFacultyDto) {
    return this.usersService.createFaculty(createFacultyDto);
  }

  @Put('faculty/:id')
  updateFaculty(
    @Param('id') id: string,
    @Body() updateFacultyDto: UpdateFacultyDto,
  ) {
    return this.usersService.updateFaculty(id, updateFacultyDto);
  }

  @Delete('faculty/:id')
  deleteFaculty(@Param('id') id: string) {
    return this.usersService.deleteFaculty(id);
  }
}
