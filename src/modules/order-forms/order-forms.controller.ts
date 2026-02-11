import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { OrderFormsService } from './order-forms.service';
import { CreateOrderFormDto, UpdateOrderFormDto } from './dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('order-forms')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('order-forms')
export class OrderFormsController {
    constructor(private readonly orderFormsService: OrderFormsService) { }

    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Create a new order form (Admin)' })
    create(@Body() createDto: CreateOrderFormDto) {
        return this.orderFormsService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'List all order forms' })
    findAll() {
        return this.orderFormsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an order form by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.orderFormsService.findOne(id);
    }

    @Patch(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Update an order form (Admin)' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateOrderFormDto) {
        return this.orderFormsService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Delete an order form (Admin)' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.orderFormsService.remove(id);
    }
}
