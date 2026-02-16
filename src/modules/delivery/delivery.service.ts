import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ConfiguracoesService } from '../configuracoes/configuracoes.service';

@Injectable()
export class DeliveryService {
    private readonly logger = new Logger(DeliveryService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly routesService: RoutesService,
        private readonly configuracoesService: ConfiguracoesService,
    ) { }

    async createRoute(createRouteDto: CreateRouteDto) {
        const { formId, destinations, origin, departureTime, couriers = 1 } = createRouteDto;

        // destinations is now { address: string; name: string; orderId?: number }[]

        let originAddress = origin;
        // Config fetching only for origin address fallback
        let config: any = null;
        if (!originAddress) {
            config = await this.configuracoesService.get();
        }

        if (!originAddress) {
            const rest = config?.enderecoRestaurante;

            if (rest) {
                if (rest.endereco) {
                    originAddress = rest.endereco;
                } else if (rest.logradouro) {
                    originAddress = `${rest.logradouro}${rest.numero ? `, ${rest.numero}` : ''}${rest.complemento ? ` - ${rest.complemento}` : ''} - ${rest.bairro}, ${rest.cidade}-${rest.estado}`;
                }
            }

            if (!originAddress) {
                this.logger.error('Restaurant address (origin) is not configured and no origin was provided.');
                throw new BadRequestException('Restaurant address not configured. Please set it in Admin Settings.');
            }
        }

        // Validate destinations
        if (!destinations || destinations.length === 0) {
            throw new Error('No destinations provided for the route.');
        }

        // Filter out empty or too short addresses that definitely won't geocode
        const validDestinations = destinations.filter(d => d.address && d.address.trim().length > 5);
        if (validDestinations.length === 0) {
            throw new Error('No valid destination addresses found. Please check the order addresses.');
        }

        // Extract addresses for optimization
        const destinationAddresses = validDestinations.map(d => d.address);

        // Fetch restaurant address for final destination
        if (!config) config = await this.configuracoesService.get();
        let restaurantAddress = '';
        const rest = config?.enderecoRestaurante;
        if (rest) {
            restaurantAddress = rest.endereco || (rest.logradouro ? `${rest.logradouro}${rest.numero ? `, ${rest.numero}` : ''}${rest.bairro ? `, ${rest.bairro}` : ''}, ${rest.cidade}-${rest.estado}` : '');
        }

        if (!restaurantAddress) {
            this.logger.warn('Restaurant address not configured for final destination. Using origin as fallback.');
            restaurantAddress = originAddress;
        }

        // Multi-Courier Logic
        const clusters: { address: string; name: string; orderId?: number; lat?: number; lng?: number }[][] = [];

        // 1. Geocode all destinations first to get coordinates for clustering
        // We use a helper from routesService or just assume we need coordinates.
        // Since we don't have coords in input, we might need a preliminary step or trust K-means on... wait.
        // K-means needs coordinates.
        // Current optimizeRoute does geocoding internally via Google.
        // We need to fetch coordinates for all addresses first if we want to cluster them.

        // Optimization: utilize routesService to get coordinates or simple geocoding.
        // For now, let's assume we send all to optimizeRoute and it returns coords, then we might need to re-optimize?
        // No, that's expensive.
        // Better approach:
        // If couriers > 1, we MUST geocode first.

        // Let's implement a simple coordinate fetcher in RoutesService or here?
        // Actually, routesService.optimizeRoute returns coordinates.
        // We can run a "dummy" optimization on ALL points to get their lat/lng, then cluster, then re-optimize per cluster.
        // Yes, this is the most reliable way without adding a new geocoding method.

        let orderedForAll: string[] = [];
        let coordsForAll: { lat: number; lng: number }[] = [];

        if (couriers > 1) {
            // Get coordinates for all points
            const result = await this.routesService.optimizeRoute(originAddress, destinationAddresses, departureTime);
            orderedForAll = result.orderedDestinations; // succinct list
            coordsForAll = result.coordinates || []; // matching coordinates

            // Map back to full objects
            const allPointsWithCoords = orderedForAll.map((addr, idx) => {
                const original = destinations.find(d => d.address === addr);
                return {
                    ...original,
                    address: addr,
                    name: original?.name || 'Cliente',
                    orderId: original?.orderId,
                    orderIds: original?.orderIds,
                    lat: coordsForAll[idx].lat,
                    lng: coordsForAll[idx].lng
                };
            });

            // K-Means Clustering
            const k = couriers;
            // Initialize centroids (pick k random points)
            if (allPointsWithCoords.length < k) {
                // Fewer points than couriers, just assign 1 per courier or all to 1
                clusters.push(allPointsWithCoords);
            } else {
                let centroids = allPointsWithCoords.slice(0, k).map(p => ({ lat: p.lat, lng: p.lng }));
                let assignments = new Array(allPointsWithCoords.length).fill(0);

                // Iterations
                for (let iter = 0; iter < 10; iter++) {
                    // Assign points to nearest centroid
                    allPointsWithCoords.forEach((p, idx) => {
                        let minDist = Infinity;
                        let clusterIdx = 0;
                        centroids.forEach((c, cIdx) => {
                            const dist = Math.sqrt(Math.pow(p.lat - c.lat, 2) + Math.pow(p.lng - c.lng, 2));
                            if (dist < minDist) {
                                minDist = dist;
                                clusterIdx = cIdx;
                            }
                        });
                        assignments[idx] = clusterIdx;
                    });

                    // Update centroids
                    const newCentroids = Array(k).fill(null).map(() => ({ lat: 0, lng: 0, count: 0 }));
                    allPointsWithCoords.forEach((p, idx) => {
                        const cIdx = assignments[idx];
                        newCentroids[cIdx].lat += p.lat;
                        newCentroids[cIdx].lng += p.lng;
                        newCentroids[cIdx].count++;
                    });

                    centroids = newCentroids.map(c =>
                        c.count === 0 ? centroids[Math.floor(Math.random() * k)] : { lat: c.lat / c.count, lng: c.lng / c.count }
                    );
                }

                // Build clusters
                for (let i = 0; i < k; i++) {
                    clusters.push(allPointsWithCoords.filter((_, idx) => assignments[idx] === i));
                }

                // Balance clusters to ensure even distribution of stops
                // Sort clusters by size (largest first)
                clusters.sort((a, b) => b.length - a.length);

                // Calculate target size for balanced distribution
                const totalStops = allPointsWithCoords.length;
                const targetSize = Math.ceil(totalStops / k);

                // Redistribute from larger clusters to smaller ones
                let redistributionNeeded = true;
                let iterations = 0;
                const maxIterations = 100;

                while (redistributionNeeded && iterations < maxIterations) {
                    redistributionNeeded = false;
                    iterations++;

                    for (let i = 0; i < clusters.length; i++) {
                        // Find the smallest cluster
                        let smallestIdx = 0;
                        let smallestSize = clusters[0].length;
                        for (let j = 1; j < clusters.length; j++) {
                            if (clusters[j].length < smallestSize) {
                                smallestSize = clusters[j].length;
                                smallestIdx = j;
                            }
                        }

                        // If current cluster is larger than target and smallest is smaller
                        if (clusters[i].length > targetSize && clusters[smallestIdx].length < targetSize && i !== smallestIdx) {
                            // Find the point in cluster[i] closest to cluster[smallestIdx] centroid
                            const smallestCentroid = clusters[smallestIdx].length > 0
                                ? {
                                    lat: clusters[smallestIdx].reduce((sum, p) => sum + (p.lat || 0), 0) / clusters[smallestIdx].length,
                                    lng: clusters[smallestIdx].reduce((sum, p) => sum + (p.lng || 0), 0) / clusters[smallestIdx].length
                                }
                                : { lat: 0, lng: 0 };

                            let closestPointIdx = 0;
                            let closestDist = Infinity;

                            clusters[i].forEach((p, idx) => {
                                const dist = Math.sqrt(
                                    Math.pow((p.lat || 0) - smallestCentroid.lat, 2) +
                                    Math.pow((p.lng || 0) - smallestCentroid.lng, 2)
                                );
                                if (dist < closestDist) {
                                    closestDist = dist;
                                    closestPointIdx = idx;
                                }
                            });

                            // Move the point
                            const pointToMove = clusters[i].splice(closestPointIdx, 1)[0];
                            clusters[smallestIdx].push(pointToMove);
                            redistributionNeeded = true;
                        }
                    }
                }

                this.logger.debug(`Balanced clusters after ${iterations} iterations: ${clusters.map(c => c.length).join(', ')}`);
            }
        } else {
            clusters.push(validDestinations);
        }

        // Process each cluster
        const allRoutesData: any[] = [];
        const allLinks: { courierId: number; url: string; label: string }[] = [];

        // Remove existing arrival times for this form to avoid stale data
        await this.prisma.pedidoEncomenda.updateMany({
            where: { dataEncomendaId: formId },
            data: { horarioEstimadoEntrega: null }
        });

        for (let i = 0; i < clusters.length; i++) {
            const clusterDestinations = clusters[i];
            if (clusterDestinations.length === 0) continue;

            const clusterAddrs = clusterDestinations.map(d => d.address);
            // Add restaurant as final destination for each cluster
            const clusterWithRest = [...clusterAddrs, restaurantAddress];

            const { orderedDestinations: orderedAddresses, arrivalTimes, coordinates } = await this.routesService.optimizeRoute(
                originAddress,
                clusterWithRest,
                departureTime
            );

            // Generate Links
            const CHUNK_SIZE = 10;
            for (let j = 0; j < orderedAddresses.length; j += CHUNK_SIZE) {
                const chunk = orderedAddresses.slice(j, j + CHUNK_SIZE);
                const linkOrigin = j === 0 ? originAddress : orderedAddresses[j - 1];
                const url = this.routesService.generateGoogleMapsLink([linkOrigin, ...chunk]);

                allLinks.push({
                    courierId: i + 1,
                    url: url,
                    label: `Rota ${i + 1} - Parte ${Math.floor(j / CHUNK_SIZE) + 1}`
                });
            }

            // Format Stops with arrival times
            const orderedStops = orderedAddresses.map((addr, index) => {
                const coord = (coordinates && coordinates[index]) || { lat: 0, lng: 0 };
                const arrivalTime = arrivalTimes[index] ? arrivalTimes[index].toISOString() : new Date().toISOString();

                if (index === orderedAddresses.length - 1 && addr === restaurantAddress) {
                    return {
                        address: addr,
                        name: 'Retorno',
                        orderId: null,
                        latitude: coord.lat,
                        longitude: coord.lng,
                        courierId: i + 1,
                        arrivalTime
                    };
                }
                const original = destinations.find(d => d.address === addr);
                return {
                    address: addr,
                    fullAddress: original?.fullAddress,
                    name: original?.name || 'Cliente',
                    orderId: original?.orderId,
                    orderIds: original?.orderIds,
                    latitude: coord.lat,
                    longitude: coord.lng,
                    courierId: i + 1,
                    arrivalTime
                };
            });

            allRoutesData.push(...orderedStops);

            // Sync ETAs
            await Promise.all(orderedStops.map(async (stop, index) => {
                if (stop.orderId) {
                    const arrivalTime = arrivalTimes[index];
                    const hours = arrivalTime.getHours().toString().padStart(2, '0');
                    const minutes = arrivalTime.getMinutes().toString().padStart(2, '0');
                    const formattedTime = `${hours}:${minutes}`;
                    await this.prisma.pedidoEncomenda.update({
                        where: { id: stop.orderId },
                        data: { horarioEstimadoEntrega: formattedTime }
                    });
                }
            }));
        }

        // Use actual arrival times from Google Maps API
        const horariosChegadaJson = allRoutesData.map(stop => stop.arrivalTime || new Date().toISOString());

        const route = await this.prisma.rotaEntrega.upsert({
            where: { formId },
            update: {
                links: allLinks as any,
                nomesParadas: allRoutesData as any,
                horariosChegada: horariosChegadaJson,
            },
            create: {
                formId,
                links: allLinks as any,
                nomesParadas: allRoutesData as any,
                horariosChegada: horariosChegadaJson,
            },
        });

        return route;
    }

    async getRoute(formId: number) {
        const route = await this.prisma.rotaEntrega.findUnique({
            where: { formId },
        });

        if (!route) {
            throw new NotFoundException(`Route for form ${formId} not found`);
        }

        return route;
    }

    async deleteRoute(formId: number) {
        // Clear arrival times from orders before deleting route
        await this.prisma.pedidoEncomenda.updateMany({
            where: { dataEncomendaId: formId },
            data: { horarioEstimadoEntrega: null }
        });

        return this.prisma.rotaEntrega.delete({
            where: { formId },
        });
    }

    async updateLocation(updateLocationDto: UpdateLocationDto) {
        const { formId, latitude, longitude, courierId, userId } = updateLocationDto;

        // Log who is tracking which route for debugging/auditing
        if (userId) {
            this.logger.debug(`Location update from user ${userId} for form ${formId}, courier route ${courierId || 1}`);
        }

        const whereClause: any = { formId };
        if (courierId !== undefined) {
            whereClause.courierId = courierId;
        }

        // Find existing location entry for this courier/form
        // Each courier route (1, 2, etc.) has its own location record
        const existing = await this.prisma.entregadorLocalizacao.findFirst({
            where: whereClause
        });

        if (existing) {
            return this.prisma.entregadorLocalizacao.update({
                where: { id: existing.id },
                data: {
                    latitude,
                    longitude,
                    atualizadoEm: new Date(),
                    courierId // Update courierId just in case it was null before but now we know it
                }
            });
        }

        return this.prisma.entregadorLocalizacao.create({
            data: {
                formId,
                latitude,
                longitude,
                courierId
            },
        });
    }

    async markDeliveryComplete(formId: number, paradaIdx: number) {
        const result = await this.prisma.entregaConcluida.upsert({
            where: {
                formId_paradaIdx: {
                    formId,
                    paradaIdx,
                },
            },
            update: {},
            create: {
                formId,
                paradaIdx,
            },
        });

        // Sync Order Status: Mark associated order as 'entregue'
        const route = await this.prisma.rotaEntrega.findUnique({ where: { formId } });
        if (route?.nomesParadas) {
            const stops = route.nomesParadas as any[];
            const stop = stops[paradaIdx];
            if (stop?.orderId) {
                const order = await this.prisma.pedidoEncomenda.findUnique({ where: { id: stop.orderId } });
                if (order) {
                    await this.prisma.pedidoEncomenda.update({
                        where: { id: stop.orderId },
                        data: {
                            statusPagamento: 'entregue',
                            statusPagamentoAnterior: order.statusPagamento,
                            emEntrega: false
                        },
                    });
                }
            }
        }

        return result;
    }

    async unmarkDeliveryComplete(formId: number, paradaIdx: number) {
        const result = await this.prisma.entregaConcluida.deleteMany({
            where: {
                formId,
                paradaIdx,
            },
        });

        // Sync Order Status: Revert associated order
        const route = await this.prisma.rotaEntrega.findUnique({ where: { formId } });
        if (route?.nomesParadas) {
            const stops = route.nomesParadas as any[];
            const stop = stops[paradaIdx];
            if (stop?.orderId) {
                const order = await this.prisma.pedidoEncomenda.findUnique({ where: { id: stop.orderId } });
                if (order) {
                    // Determine restored status based on existing data
                    let restoredStatus = 'pendente';
                    if (order.dataPagamento) {
                        restoredStatus = 'confirmado';
                    } else if (order.comprovanteUrl) {
                        restoredStatus = 'aguardando_confirmacao';
                    }

                    await this.prisma.pedidoEncomenda.update({
                        where: { id: stop.orderId },
                        data: {
                            statusPagamento: restoredStatus,
                            emEntrega: true
                        },
                    });
                }
            }
        }

        return result;
    }

    async getActiveTracking(formId: number, courierId: number) {
        // Check if there's an active location tracking for this form + courier
        // Consider "active" if there was an update within the last 60 seconds
        const ACTIVE_THRESHOLD_SECONDS = 60;

        const location = await this.prisma.entregadorLocalizacao.findFirst({
            where: {
                formId,
                courierId
            },
            orderBy: { atualizadoEm: 'desc' }
        });

        if (!location) {
            return { isActive: false, userId: null, lastUpdate: null };
        }

        const now = new Date();
        const lastUpdate = new Date(location.atualizadoEm);
        const diffSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

        // We store the userId in a comment or we need to track it separately
        // For now, we'll use a separate tracking table or check
        // Since we don't have userId in entregadorLocalizacao, we'll need to add it
        // For now, return based on time only
        return {
            isActive: diffSeconds < ACTIVE_THRESHOLD_SECONDS,
            userId: null, // TODO: Store userId in location table for proper tracking
            lastUpdate: location.atualizadoEm,
            secondsAgo: Math.floor(diffSeconds)
        };
    }

    async startRouteSharing(formId: number, courierId?: number, userId?: string) {
        const route = await this.prisma.rotaEntrega.findUnique({
            where: { formId },
        });

        if (!route || !route.nomesParadas) {
            throw new NotFoundException(`Route for form ${formId} not found`);
        }

        const stops = route.nomesParadas as any[];

        // Filter stops by courierId if provided
        const relevantStops = courierId !== undefined
            ? stops.filter(stop => stop.courierId === courierId)
            : stops;

        const orderIds = relevantStops
            .filter(stop => stop.orderId)
            .map(stop => stop.orderId);

        if (orderIds.length > 0) {
            // Use emEntrega flag instead of statusPagamento
            await this.prisma.pedidoEncomenda.updateMany({
                where: {
                    id: { in: orderIds },
                    // Do not update already delivered or cancelled orders
                    statusPagamento: { notIn: ['entregue', 'cancelado'] }
                },
                data: { emEntrega: true },
            });
        }

        this.logger.debug(`Route sharing started for form ${formId}, courier ${courierId || 'all'}, by user ${userId || 'unknown'}`);

        return { success: true, updatedCount: orderIds.length, courierId, userId };
    }

    async stopRouteSharing(formId: number, courierId?: number) {
        const route = await this.prisma.rotaEntrega.findUnique({
            where: { formId },
        });

        if (!route || !route.nomesParadas) {
            throw new NotFoundException(`Route for form ${formId} not found`);
        }

        const stops = route.nomesParadas as any[];

        // Filter stops by courierId if provided
        const relevantStops = courierId !== undefined
            ? stops.filter(stop => stop.courierId === courierId)
            : stops;

        const orderIds = relevantStops
            .filter(stop => stop.orderId)
            .map(stop => stop.orderId);

        if (orderIds.length > 0) {
            await this.prisma.pedidoEncomenda.updateMany({
                where: { id: { in: orderIds } },
                data: { emEntrega: false },
            });
        }

        // Clear location record to indicate tracking stopped
        if (courierId !== undefined) {
            await this.prisma.entregadorLocalizacao.deleteMany({
                where: { formId, courierId }
            });
        }

        return { success: true, updatedCount: orderIds.length };
    }

    async getDeliveryStatus(formId: number, courierId?: number) {
        // Get completed deliveries
        const completed = await this.prisma.entregaConcluida.findMany({
            where: { formId }
        });

        // Build location query - filter by courierId if provided
        const locationWhere: any = { formId };
        if (courierId !== undefined) {
            locationWhere.courierId = courierId;
        }

        // Get latest location for the specific courier
        const location = await this.prisma.entregadorLocalizacao.findFirst({
            where: locationWhere,
            orderBy: { atualizadoEm: 'desc' }
        });

        return {
            completedStops: completed.map(c => c.paradaIdx),
            latestLocation: location,
            courierId: courierId || (location?.courierId ?? null)
        };
    }
    async calculateDynamicETAs(formId: number, courierId?: number) {
        const route = await this.prisma.rotaEntrega.findUnique({
            where: { formId }
        });

        if (!route) return null;

        const completed = await this.prisma.entregaConcluida.findMany({
            where: { formId }
        });

        const completedIdxs = completed.map(c => c.paradaIdx);
        const stops = (route.nomesParadas as any[]) || [];

        // Find latest location. If courierId provided, use it.
        const whereClause: any = { formId };
        if (courierId) {
            whereClause.courierId = courierId;
        }

        const location = await this.prisma.entregadorLocalizacao.findFirst({
            where: whereClause,
            orderBy: { atualizadoEm: 'desc' }
        });

        if (!location) {
            this.logger.debug(`No location found for dynamic ETA calculation for formId ${formId}`);
            return null;
        }

        // Get indices of pending stops
        let pendingStops = stops
            .map((s, idx) => ({ ...s, originalIdx: idx }))
            .filter((s, idx) => !completedIdxs.includes(idx));

        // Filter by courier if multi-courier route and courierId is known
        if (courierId) {
            pendingStops = pendingStops.filter(s => s.courierId === courierId);
        }

        if (pendingStops.length === 0) return [];

        const pendingAddresses = pendingStops.map(s => s.address);

        try {
            const dynamicArrivalTimes = await this.routesService.getEtaForRemainingStops(
                Number(location.latitude),
                Number(location.longitude),
                pendingAddresses
            );

            // Map back to original indices
            return pendingStops.map((s, idx) => ({
                paradaIdx: s.originalIdx,
                eta: dynamicArrivalTimes[idx]
            }));
        } catch (error) {
            this.logger.error('Failed to calculate dynamic ETAs', error);
            return null;
        }
    }
}
