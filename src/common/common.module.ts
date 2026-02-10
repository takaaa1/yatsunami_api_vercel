import { Module, Global } from '@nestjs/common';
import { MailService } from './services/mail.service';

@Global()
@Module({
    providers: [MailService],
    exports: [MailService],
})
export class CommonModule { }
