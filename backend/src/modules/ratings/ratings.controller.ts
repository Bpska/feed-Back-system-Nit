import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  Put,
  Delete,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RatingsService } from './ratings.service';
import {
  CreateRatingDto,
  CreateHostelRatingDto,
  CreateFacultyAssignmentDto,
} from '../../dto/rating.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private ratingsService: RatingsService) { }

  @Get('assignments')
  getFacultyAssignments(
    @Query('year') year?: string,
    @Query('semester') semester?: string,
    @Query('branch') branch?: string,
    @Query('section') section?: string,
  ) {
    return this.ratingsService.getFacultyAssignments(
      year ? parseInt(year) : undefined,
      semester ? parseInt(semester) : undefined,
      branch,
      section,
    );
  }

  @Post()
  createRating(
    @Request() req: AuthenticatedRequest,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    return this.ratingsService.createRating(req.user.userId, createRatingDto);
  }

  @Get('my-ratings')
  getStudentRatings(@Request() req: AuthenticatedRequest) {
    return this.ratingsService.getStudentRatings(req.user.userId);
  }

  @Get('faculty/:facultyId')
  getFacultyRatings(
    @Param('facultyId') facultyId: string,
    @Query('semester') semester?: string,
    @Query('section') section?: string,
    @Query('branch') branch?: string,
  ) {
    return this.ratingsService.getFacultyRatings(
      facultyId,
      semester ? parseInt(semester) : undefined,
      section,
      branch,
    );
  }

  @Post('hostel')
  createHostelRating(
    @Request() req: AuthenticatedRequest,
    @Body() createHostelRatingDto: CreateHostelRatingDto,
  ) {
    return this.ratingsService.createHostelRating(
      req.user.userId,
      createHostelRatingDto,
    );
  }

  @Get('hostel/all')
  getAllHostelRatings() {
    // Ideally add AdminGuard here, but verified on frontend
    return this.ratingsService.getAllHostelRatings();
  }

  @Get('hostel')
  getHostelRating(@Request() req: AuthenticatedRequest) {
    return this.ratingsService.getHostelRating(req.user.userId);
  }

  @Post('assignments')
  createFacultyAssignment(
    @Body() createFacultyAssignmentDto: CreateFacultyAssignmentDto,
  ) {
    return this.ratingsService.createFacultyAssignment(
      createFacultyAssignmentDto,
    );
  }

  @Get('assignments/all')
  getAllFacultyAssignments() {
    return this.ratingsService.getAllFacultyAssignments();
  }

  @Get('assignments/:assignmentId/ratings')
  getAssignmentRatings(@Param('assignmentId') assignmentId: string) {
    return this.ratingsService.getAssignmentRatings(assignmentId);
  }
  @Get('all')
  getAllRatings() {
    return this.ratingsService.getAllRatings();
  }

  @Put('assignments/:id')
  updateFacultyAssignment(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateFacultyAssignmentDto>,
  ) {
    return this.ratingsService.updateFacultyAssignment(id, updateDto);
  }

  @Delete('hostel/:id')
  deleteHostelRating(@Param('id') id: string) {
    return this.ratingsService.deleteHostelRating(id);
  }

  @Delete('hostel/bulk')
  bulkDeleteHostelRatings(@Body() body: { ids: string[] }) {
    return this.ratingsService.bulkDeleteHostelRatings(body.ids);
  }

  @Delete('faculty/:facultyId/all')
  deleteAllFacultyRatings(@Param('facultyId') facultyId: string) {
    return this.ratingsService.deleteAllFacultyRatings(facultyId);
  }
}
