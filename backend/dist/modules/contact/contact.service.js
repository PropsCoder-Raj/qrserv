"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let ContactService = class ContactService {
    constructor(configService) {
        this.configService = configService;
    }
    createTransport() {
        const host = this.configService.get('mail.host');
        const port = this.configService.get('mail.port');
        const user = this.configService.get('mail.user');
        const pass = this.configService.get('mail.pass');
        const secure = this.configService.get('mail.secure');
        if (!host || !port || !user || !pass) {
            throw new common_1.BadRequestException('Mail server is not configured');
        }
        return nodemailer.createTransport({
            host,
            port,
            secure: Boolean(secure),
            auth: { user, pass },
        });
    }
    async sendContactMessage(dto) {
        const to = this.configService.get('mail.to') || 'quickratingservice@gmail.com';
        const from = this.configService.get('mail.from') ||
            this.configService.get('mail.user');
        const subjectPrefix = this.configService.get('mail.subjectPrefix') || 'QRserve';
        const transporter = this.createTransport();
        const subject = `${subjectPrefix} Contact: ${dto.name}`;
        const text = [`Name: ${dto.name}`, `Email: ${dto.email}`, '', dto.message].join('\n');
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
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ContactService);
function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
//# sourceMappingURL=contact.service.js.map