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
    private readonly etaThrottle = new Map<number, number>();
    private readonly THROTTLE_MS = 30000; // 30 seconds

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
        // 1. Save to DB
        await this.deliveryService.updateLocation(payload);

        // 2. Broadcast location to room
        this.server.to(`tracking_${payload.formId}`).emit('locationUpdate', payload);

        // 3. Handle Dynamic ETA
        await this.handleDynamicETA(payload.formId);
    }

    // Accessible from Controller for background updates
    async handleDynamicETA(formId: number) {
        const now = Date.now();
        const lastRun = this.etaThrottle.get(formId) || 0;

        if (now - lastRun >= this.THROTTLE_MS) {
            this.etaThrottle.set(formId, now);

            try {
                const dynamicEtas = await this.deliveryService.calculateDynamicETAs(formId);
                if (dynamicEtas) {
                    this.server.to(`tracking_${formId}`).emit('etaUpdate', dynamicEtas);
                }
            } catch (error) {
                // Silently fail to not block location updates
            }
        }
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

    // Notify clients that sharing was started or stopped
    broadcastSharingStatus(formId: number, active: boolean) {
        this.server.to(`tracking_${formId}`).emit('sharingStatus', { formId, active });
    }
}
