import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DeliveryService } from './delivery.service';
import { UpdateLocationDto } from './dto/update-location.dto';

@WebSocketGateway({ cors: true })
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(private readonly deliveryService: DeliveryService) { }

    handleConnection(client: Socket) {
        // console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        // console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('updateLocation')
    async handleLocationUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: UpdateLocationDto,
    ) {
        // 1. Save to DB (maybe throttle this in production?)
        await this.deliveryService.updateLocation(payload);

        // 2. Broadcast to room (e.g., 'tracking_formId')
        // usage: client.emit('locationUpdate', payload)
        this.server.to(`tracking_${payload.formId}`).emit('locationUpdate', payload);
    }

    @SubscribeMessage('joinTracking')
    handleJoinTracking(
        @ConnectedSocket() client: Socket,
        @MessageBody('formId') formId: number,
    ) {
        client.join(`tracking_${formId}`);
        return { event: 'joinedTracking', data: formId };
    }

    @SubscribeMessage('leaveTracking')
    handleLeaveTracking(
        @ConnectedSocket() client: Socket,
        @MessageBody('formId') formId: number,
    ) {
        client.leave(`tracking_${formId}`);
        return { event: 'leftTracking', data: formId };
    }

    // Used by REST controller when a delivery is marked as complete
    sendDeliveryUpdate(formId: number, paradaIdx: number) {
        this.server.to(`tracking_${formId}`).emit('deliveryUpdate', { formId, paradaIdx });
    }
}
