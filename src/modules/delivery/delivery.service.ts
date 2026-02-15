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
        const { formId, destinations, origin, departureTime } = createRouteDto;

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

        // Add restaurant as the final destination to the optimization list
        const destinationAddressesWithRestaurant = [...destinationAddresses, restaurantAddress];

        const { orderedDestinations: orderedAddresses, arrivalTimes, coordinates } = await this.routesService.optimizeRoute(
            originAddress,
            destinationAddressesWithRestaurant,
            departureTime
        );

        // Split into chunks of 10 stops per link
        const links: string[] = [];
        const CHUNK_SIZE = 10;

        for (let i = 0; i < orderedAddresses.length; i += CHUNK_SIZE) {
            const chunk = orderedAddresses.slice(i, i + CHUNK_SIZE);
            const linkOrigin = i === 0 ? originAddress : orderedAddresses[i - 1];

            // Link is: Origin (Previous stop or original origin) -> [Waypoints] -> Final Stop in chunk
            links.push(this.routesService.generateGoogleMapsLink([
                linkOrigin,
                ...chunk
            ]));
        }

        const horariosChegadaJson = arrivalTimes.map(dt => dt.toISOString());

        // Reconstruct the ordered objects with names and coordinates
        const orderedStops = orderedAddresses.map((addr, index) => {
            const coord = (coordinates && coordinates[index]) || { lat: 0, lng: 0 };

            // If it's the last stop and matches restaurant address, it's the "Retorno"
            if (index === orderedAddresses.length - 1 && addr === restaurantAddress) {
                return {
                    address: addr,
                    name: 'Retorno',
                    orderId: null,
                    latitude: coord.lat,
                    longitude: coord.lng,
                };
            }

            // Find the original destination object that matches this address
            const original = destinations.find(d => d.address === addr);
            return {
                address: addr,
                name: original?.name || 'Cliente',
                orderId: original?.orderId,
                latitude: coord.lat,
                longitude: coord.lng,
            };
        });

        const route = await this.prisma.rotaEntrega.upsert({
            where: { formId },
            update: {
                links: links,
                nomesParadas: orderedStops as any,
                horariosChegada: horariosChegadaJson,
            },
            create: {
                formId,
                links: links,
                nomesParadas: orderedStops as any,
                horariosChegada: horariosChegadaJson,
            },
        });

        // Sync arrival times to orders
        await Promise.all(orderedStops.map(async (stop, index) => {
            if (stop.orderId) {
                const arrivalTime = arrivalTimes[index];
                // Format to HH:mm
                const hours = arrivalTime.getHours().toString().padStart(2, '0');
                const minutes = arrivalTime.getMinutes().toString().padStart(2, '0');
                const formattedTime = `${hours}:${minutes}`;

                await this.prisma.pedidoEncomenda.update({
                    where: { id: stop.orderId },
                    data: { horarioEstimadoEntrega: formattedTime }
                });
            }
        }));

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
        const { formId, latitude, longitude } = updateLocationDto;

        return this.prisma.entregadorLocalizacao.create({
            data: {
                formId,
                latitude,
                longitude,
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

    async startRouteSharing(formId: number) {
        const route = await this.prisma.rotaEntrega.findUnique({
            where: { formId },
        });

        if (!route || !route.nomesParadas) {
            throw new NotFoundException(`Route for form ${formId} not found`);
        }

        const stops = route.nomesParadas as any[];
        const orderIds = stops
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

        return { success: true, updatedCount: orderIds.length };
    }

    async stopRouteSharing(formId: number) {
        const route = await this.prisma.rotaEntrega.findUnique({
            where: { formId },
        });

        if (!route || !route.nomesParadas) {
            throw new NotFoundException(`Route for form ${formId} not found`);
        }

        const stops = route.nomesParadas as any[];
        const orderIds = stops
            .filter(stop => stop.orderId)
            .map(stop => stop.orderId);

        if (orderIds.length > 0) {
            await this.prisma.pedidoEncomenda.updateMany({
                where: { id: { in: orderIds } },
                data: { emEntrega: false },
            });
        }

        return { success: true, updatedCount: orderIds.length };
    }

    async getDeliveryStatus(formId: number) {
        // Get completed deliveries
        const completed = await this.prisma.entregaConcluida.findMany({
            where: { formId }
        });

        // Get latest location
        const location = await this.prisma.entregadorLocalizacao.findFirst({
            where: { formId },
            orderBy: { atualizadoEm: 'desc' }
        });

        return {
            completedStops: completed.map(c => c.paradaIdx),
            latestLocation: location
        };
    }
    async calculateDynamicETAs(formId: number) {
        const route = await this.prisma.rotaEntrega.findUnique({
            where: { formId }
        });

        if (!route) return null;

        const completed = await this.prisma.entregaConcluida.findMany({
            where: { formId }
        });

        const completedIdxs = completed.map(c => c.paradaIdx);
        const stops = (route.nomesParadas as any[]) || [];

        // Find latest location
        const location = await this.prisma.entregadorLocalizacao.findFirst({
            where: { formId },
            orderBy: { atualizadoEm: 'desc' }
        });

        if (!location) {
            this.logger.debug(`No location found for dynamic ETA calculation for formId ${formId}`);
            return null;
        }

        // Get indices of pending stops
        const pendingStops = stops
            .map((s, idx) => ({ ...s, originalIdx: idx }))
            .filter((s, idx) => !completedIdxs.includes(idx));

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
