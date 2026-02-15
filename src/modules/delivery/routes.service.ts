import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RoutesService {
    private readonly logger = new Logger(RoutesService.name);
    private readonly googleMapsKey: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.googleMapsKey = (this.configService.get<string>('googleMapsKey') || '').trim();
        const key = this.googleMapsKey;
        this.logger.debug(`Google Maps Key loaded (Length: ${key.length})`);
        // Debugging raw key characters to catch invisible ones
        this.logger.debug(`Key Hex: ${Buffer.from(key).toString('hex')}`);
    }

    async optimizeRoute(origin: string, destinations: string[], departureTime?: string) {
        if (!destinations.length) return { orderedDestinations: [], arrivalTimes: [] };

        const finalDestination = destinations[destinations.length - 1];
        const waypoints = destinations.slice(0, destinations.length - 1);

        const waypointsStr = waypoints.length
            ? `optimize:true|${waypoints.map((wp) => encodeURIComponent(wp)).join('|')}`
            : '';

        let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
            origin,
        )}&destination=${encodeURIComponent(
            finalDestination,
        )}&waypoints=${waypointsStr}&key=${this.googleMapsKey}`;

        let finalDepartureTimestamp = Date.now();
        if (departureTime) {
            const requestedTime = new Date(departureTime).getTime();
            // Google requires departure_time to be now or in the future
            if (requestedTime > finalDepartureTimestamp) {
                finalDepartureTimestamp = requestedTime;
            }

            url += `&departure_time=${Math.floor(finalDepartureTimestamp / 1000)}`;
        }

        this.logger.debug(`Google Maps Request URL: ${url.replace(/key=[^&]+/, 'key=REDACTED')}`);

        try {
            const { data } = await firstValueFrom(this.httpService.get(url));

            if (data.status !== 'OK') {
                this.logger.error(`Google Maps API error: ${data.status} - ${data.error_message || 'No error message'}`);
                if (data.status === 'NOT_FOUND') {
                    this.logger.error('Check your origin and destination addresses. One or more could not be geocoded.');
                }
                throw new Error(`Google Maps API error: ${data.status}`);
            }

            const route = data.routes[0];
            const optimizedOrder = route.waypoint_order;
            const legs = route.legs; // Array of legs between waypoints

            // Reorder waypoints based on optimized order
            const orderedDestinations = optimizedOrder.map(index => waypoints[index]);
            orderedDestinations.push(finalDestination);

            // Calculate arrival times
            let currentTimestamp = finalDepartureTimestamp;
            const arrivalTimes: Date[] = [];
            const coordinates: { lat: number; lng: number }[] = [];

            // legs[0] is origin -> first waypoint
            // legs[1] is first -> second
            // ...
            // legs[len-1] is last waypoint -> destination

            // Note: Google Maps API with optimize:true returns the legs IN THE OPTIMIZED ORDER.
            // So we can just iterate through legs to get durations and coordinates.

            for (const leg of legs) {
                // leg.duration.value is in seconds
                currentTimestamp += leg.duration.value * 1000;
                arrivalTimes.push(new Date(currentTimestamp));

                // Capture coordinates for each stop
                coordinates.push({
                    lat: leg.end_location.lat,
                    lng: leg.end_location.lng,
                });
            }

            return { orderedDestinations, arrivalTimes, coordinates };
        } catch (error) {
            this.logger.error('Error optimizing route', error);
            throw error;
        }
    }

    generateGoogleMapsLink(destinations: string[]): string {
        // https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...
        if (!destinations.length) return '';

        const origin = encodeURIComponent(destinations[0]);
        const destination = encodeURIComponent(destinations[destinations.length - 1]);

        let waypoints = '';
        if (destinations.length > 2) {
            waypoints = '&waypoints=' + destinations.slice(1, destinations.length - 1).map(d => encodeURIComponent(d)).join('|');
        }

        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}`;
    }
}
