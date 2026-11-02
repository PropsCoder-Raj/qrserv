import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Table, TableSchema } from '../../schemas/table.schema';
import { WaiterCallsController } from './waiter-calls.controller';
import { WaiterCallsService } from './waiter-calls.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Table.name, schema: TableSchema }])],
  controllers: [WaiterCallsController],
  providers: [WaiterCallsService],
})
export class WaiterCallsModule {}
