import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AvailabilityService } from './availability.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateAvailabilitySchema,
  UpdateAvailabilitySchema,
  CreateExceptionSchema,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  CreateExceptionDto,
} from './schemas/availability.schema';

interface AuthRequest { user: { id: string } }

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Request() req: AuthRequest,
    @Body(new ZodValidationPipe(CreateAvailabilitySchema)) dto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(req.user.id, dto);
  }

  @Get('provider/:providerId')
  async findByProvider(@Param('providerId') providerId: string) {
    return this.availabilityService.findByProvider(providerId);
  }

  @Get('slots')
  async getSlots(
    @Query('providerId') providerId: string,
    @Query('date') date: string,
  ) {
    return this.availabilityService.getSlotsForDate(providerId, date);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAvailabilitySchema)) dto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string) {
    return this.availabilityService.remove(id);
  }

  @Post('exceptions')
  @UseGuards(AuthGuard('jwt'))
  async createException(
    @Body(new ZodValidationPipe(CreateExceptionSchema)) dto: CreateExceptionDto,
  ) {
    return this.availabilityService.createException(dto);
  }
}
