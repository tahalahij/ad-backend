import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type DeviceScheduleDocument = DeviceSchedule & mongoose.Document;

@Schema()
export class DeviceSchedule {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' })
  schedule: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Device' })
  device: mongoose.Types.ObjectId;

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  updatedAt: mongoose.Schema.Types.Date;
}

export const DeviceScheduleSchema = SchemaFactory.createForClass(DeviceSchedule);
