import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersPushTokenController } from './users-push-token.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [UsersPushTokenController, UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
