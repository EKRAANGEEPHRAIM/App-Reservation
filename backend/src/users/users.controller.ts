import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateUserSchema, CreateProviderSchema, UpdateUserDto, CreateProviderDto } from './schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Request() req: { user: { id: string } }) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  async updateMe(
    @Request() req: { user: { id: string } },
    @Body(new ZodValidationPipe(UpdateUserSchema)) dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.id, dto);
  }

  @Post('me/provider')
  @UseGuards(AuthGuard('jwt'))
  async createProvider(
    @Request() req: { user: { id: string } },
    @Body(new ZodValidationPipe(CreateProviderSchema)) dto: CreateProviderDto,
  ) {
    return this.usersService.createProvider(req.user.id, dto);
  }

  @Get('providers')
  async findProviders(@Query('category') category?: string) {
    return this.usersService.findAllProviders(category);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
