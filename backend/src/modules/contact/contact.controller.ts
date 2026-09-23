import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ContactService } from './contact.service';
import { SendContactMessageDto } from './dto/send-contact-message.dto';

@ApiTags('Contact')
@Controller('api/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Send contact-us message (email)' })
  send(@Body() dto: SendContactMessageDto) {
    return this.contactService.sendContactMessage(dto);
  }
}
