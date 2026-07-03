import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingsService } from './bookings.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateBookingSchema,
  UpdateBookingStatusSchema,
  CreateBookingDto,
  UpdateBookingStatusDto,
} from './schemas/booking.schema';

interface AuthRequest { user: { id: string } }

@Controller('bookings')
@UseGuards(AuthGuard('jwt'))
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(
    @Request() req: AuthRequest,
    @Body(new ZodValidationPipe(CreateBookingSchema)) dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(req.user.id, dto);
  }

  @Get('my')
  async myBookings(@Request() req: AuthRequest) {
    return this.bookingsService.findByClient(req.user.id);
  }

  @Get('provider')
  async providerBookings(@Request() req: AuthRequest) {
    return this.bookingsService.findByProvider(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateBookingStatusSchema)) dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }
}
