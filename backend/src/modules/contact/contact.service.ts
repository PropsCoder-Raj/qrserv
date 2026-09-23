import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendContactMessageDto } from './dto/send-contact-message.dto';

@Injectable()
export class ContactService {
  constructor(private readonly configService: ConfigService) {}

  private createTransport() {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');
    const secure = this.configService.get<boolean>('mail.secure');

    if (!host || !port || !user || !pass) {
      throw new BadRequestException('Mail server is not configured');
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: Boolean(secure),
      auth: { user, pass },
    });
  }

  async sendContactMessage(dto: SendContactMessageDto) {
    const to =
      this.configService.get<string>('mail.to') || 'quickratingservice@gmail.com';
    const from =
      this.configService.get<string>('mail.from') ||
      this.configService.get<string>('mail.user');
    const subjectPrefix =
      this.configService.get<string>('mail.subjectPrefix') || 'QRserve';

    const transporter = this.createTransport();

    const subject = `${subjectPrefix} Contact: ${dto.name}`;
    const text = [`Name: ${dto.name}`, `Email: ${dto.email}`, '', dto.message].join(
      '\n',
    );

    const html = `
      <div style="font-family:Arial,sans-serif; line-height:1.5">
        <h2 style="margin:0 0 12px">New contact message</h2>
        <div><b>Name:</b> ${escapeHtml(dto.name)}</div>
        <div><b>Email:</b> ${escapeHtml(dto.email)}</div>
        <hr style="margin:16px 0" />
        <div style="white-space:pre-wrap">${escapeHtml(dto.message)}</div>
      </div>
    `;

    await transporter.sendMail({
      to,
      from,
      subject,
      replyTo: dto.email,
      text,
      html,
    });

    return { message: 'Message sent successfully' };
  }
}

function escapeHtml(str: string) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
