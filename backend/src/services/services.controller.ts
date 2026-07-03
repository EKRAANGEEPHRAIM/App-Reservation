import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicesService } from './services.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateServiceSchema, UpdateServiceSchema, CreateServiceDto, UpdateServiceDto } from './schemas/service.schema';

interface AuthRequest {
  user: { id: string; role: string };
}

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Request() req: AuthRequest,
    @Body(new ZodValidationPipe(CreateServiceSchema)) dto: CreateServiceDto,
  ) {
    return this.servicesService.create(req.user.id, dto);
  }

  @Get('provider/:providerId')
  async findByProvider(@Param('providerId') providerId: string) {
    return this.servicesService.findByProvider(providerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body(new ZodValidationPipe(UpdateServiceSchema)) dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.servicesService.remove(id, req.user.id);
  }
}
