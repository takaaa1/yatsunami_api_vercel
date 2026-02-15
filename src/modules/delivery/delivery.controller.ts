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
    updateLocation(@Body() updateLocationDto: UpdateLocationDto) {
        return this.deliveryService.updateLocation(updateLocationDto);
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
        return this.deliveryService.startRouteSharing(formId);
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
