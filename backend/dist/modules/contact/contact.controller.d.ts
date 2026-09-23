import { ContactService } from './contact.service';
import { SendContactMessageDto } from './dto/send-contact-message.dto';
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    send(dto: SendContactMessageDto): Promise<{
        message: string;
    }>;
}
