import { Controller, Get, Post, Patch, Body, Param, UseGuards, ParseIntPipe, Delete, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

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

    @Get(':id/pix-qrcode')
    @ApiOperation({ summary: 'Gerar QR Code PIX para um pedido' })
    @ApiResponse({ status: 200, description: 'QR Code PIX gerado' })
    @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
    getPixQrCode(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: string) {
        return this.ordersService.getPixQrCode(id, userId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Atualizar um pedido (antes do deadline)' })
    @ApiResponse({ status: 200, description: 'Pedido atualizado com sucesso' })
    @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
    @ApiResponse({ status: 400, description: 'Prazo expirado ou pedido não pode ser editado' })
    @ApiResponse({ status: 403, description: 'Sem permissão para editar este pedido' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('id') userId: string,
        @Body() updateOrderDto: UpdateOrderDto
    ) {
        return this.ordersService.update(id, userId, updateOrderDto);
    }

    // Admin endpoints
    @Post(':id/confirm-payment')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Confirmar pagamento de um pedido (Admin)' })
    @ApiResponse({ status: 200, description: 'Pagamento confirmado' })
    @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
    @ApiResponse({ status: 400, description: 'Operação inválida' })
    confirmPayment(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') adminUserId: string) {
        return this.ordersService.confirmPayment(id, adminUserId);
    }

    @Post(':id/revert-payment')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Reverter confirmação de pagamento (Admin)' })
    @ApiResponse({ status: 200, description: 'Pagamento revertido' })
    @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
    @ApiResponse({ status: 400, description: 'Operação inválida' })
    revertPayment(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') adminUserId: string) {
        return this.ordersService.revertPayment(id, adminUserId);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Cancelar um pedido (Admin)' })
    @ApiResponse({ status: 200, description: 'Pedido cancelado' })
    @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
    @ApiResponse({ status: 400, description: 'Operação inválida' })
    cancelOrder(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') adminUserId: string) {
        return this.ordersService.cancelOrder(id, adminUserId);
    }

    @Post(':id/revert-cancellation')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Reverter cancelamento de um pedido (Admin)' })
    @ApiResponse({ status: 200, description: 'Cancelamento revertido' })
    @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
    @ApiResponse({ status: 400, description: 'Operação inválida' })
    revertCancellation(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') adminUserId: string) {
        return this.ordersService.revertCancellation(id, adminUserId);
    }

    @Get('form/:formId')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Listar pedidos de um formulário (Admin)' })
    @ApiResponse({ status: 200, description: 'Lista de pedidos do formulário retornada' })
    findByOrderForm(
        @Param('formId') formId: string,
        @Query('search') search?: string,
    ) {
        return this.ordersService.findByOrderForm(+formId, search);
    }

    @Get('form/:formId/summary')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Resumo de pedidos de um formulário (Admin)' })
    @ApiResponse({ status: 200, description: 'Resumo de pedidos' })
    getOrderFormSummary(@Param('formId', ParseIntPipe) formId: number) {
        return this.ordersService.getOrderFormSummary(formId);
    }
}
