import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { StorageService } from './storage.service';
import { R2StorageService } from '../infra/storage/r2-storage.service';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
    ],
    providers: [R2StorageService, StorageService],
    exports: [R2StorageService, StorageService],
})
export class AppConfigModule { }
