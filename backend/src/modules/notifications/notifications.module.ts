import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/user.schema';
import { FcmService } from './fcm.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [NotificationsController],
  providers: [FcmService],
  exports: [FcmService],
})
export class NotificationsModule {}
