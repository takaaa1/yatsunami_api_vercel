import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Criar um novo pedido' })
    @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })
    create(@CurrentUser('id') userId: string, @Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(userId, createOrderDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar meus pedidos' })
    @ApiResponse({ status: 200, description: 'Lista de pedidos retornada' })
    findAll(@CurrentUser('id') userId: string) {
        return this.ordersService.findAll(userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obter detalhes de um pedido' })
    @ApiResponse({ status: 200, description: 'Detalhes do pedido retornados' })
    @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
    findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: string) {
        return this.ordersService.findOne(id, userId);
    }
}
