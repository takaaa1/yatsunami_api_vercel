import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { TrackingGateway } from './tracking.gateway';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('delivery')
export class DeliveryController {
    constructor(
        private readonly deliveryService: DeliveryService,
        private readonly trackingGateway: TrackingGateway,
    ) { }

    @Post('routes')
    createRoute(@Body() createRouteDto: CreateRouteDto) {
        return this.deliveryService.createRoute(createRouteDto);
    }

    @Get('routes/:formId')
    getRoute(@Param('formId', ParseIntPipe) formId: number) {
        return this.deliveryService.getRoute(formId);
    }

    @Delete('routes/:formId')
    deleteRoute(@Param('formId', ParseIntPipe) formId: number) {
        return this.deliveryService.deleteRoute(formId);
    }

    @Post('location')
    async updateLocation(@Body() updateLocationDto: UpdateLocationDto) {
        const result = await this.deliveryService.updateLocation(updateLocationDto);
        // Also broadcast to WebSockets for real-time tracking
        this.trackingGateway.server.to(`tracking_${updateLocationDto.formId}`).emit('locationUpdate', updateLocationDto);
        // Recalculate ETA if necessary (throttled)
        await this.trackingGateway.handleDynamicETA(updateLocationDto.formId);
        return result;
    }

    @Post('complete')
    async markDeliveryComplete(
        @Body('formId', ParseIntPipe) formId: number,
        @Body('paradaIdx', ParseIntPipe) paradaIdx: number,
    ) {
        const result = await this.deliveryService.markDeliveryComplete(formId, paradaIdx);
        this.trackingGateway.sendDeliveryUpdate(formId, paradaIdx);
        return result;
    }

    @Post('start-sharing')
    async startRouteSharing(
        @Body('formId', ParseIntPipe) formId: number,
    ) {
        const result = await this.deliveryService.startRouteSharing(formId);
        this.trackingGateway.broadcastSharingStatus(formId, true);
        return result;
    }

    @Post('stop-sharing')
    async stopRouteSharing(
        @Body('formId', ParseIntPipe) formId: number,
    ) {
        const result = await this.deliveryService.stopRouteSharing(formId);
        this.trackingGateway.broadcastSharingStatus(formId, false);
        return result;
    }

    @Delete('complete')
    async unmarkDeliveryComplete(
        @Body('formId', ParseIntPipe) formId: number,
        @Body('paradaIdx', ParseIntPipe) paradaIdx: number,
    ) {
        const result = await this.deliveryService.unmarkDeliveryComplete(formId, paradaIdx);
        this.trackingGateway.sendDeliveryUpdate(formId, paradaIdx);
        return result;
    }

    @Get('status/:formId')
    getDeliveryStatus(@Param('formId', ParseIntPipe) formId: number) {
        return this.deliveryService.getDeliveryStatus(formId);
    }
}
