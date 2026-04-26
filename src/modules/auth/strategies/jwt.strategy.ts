import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma';

export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.secret'),
            algorithms: ['HS256'],
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.prisma.usuario.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                tema: true,
                idioma: true,
                telefone: true,
                endereco: true,
                receberNotificacoes: true,
                ativo: true,
            },
        });

        if (!user) {
            this.logger.warn(`User with id ${payload.sub} not found in database`);
            throw new UnauthorizedException('Usuário não encontrado');
        }

        if (!user.ativo) {
            this.logger.warn(`Blocked request from inactive user: ${user.email}`);
            throw new UnauthorizedException('Conta desativada.');
        }

        return user;
    }
}
