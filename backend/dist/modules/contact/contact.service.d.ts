import { ConfigService } from '@nestjs/config';
import { SendContactMessageDto } from './dto/send-contact-message.dto';
export declare class ContactService {
    private readonly configService;
    constructor(configService: ConfigService);
    private createTransport;
    sendContactMessage(dto: SendContactMessageDto): Promise<{
        message: string;
    }>;
}
