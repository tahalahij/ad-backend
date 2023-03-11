import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type DeviceDocument = Device & mongoose.Document;

@Schema()
export class Device {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, required: false })
  ip: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  operatorId: mongoose.Types.ObjectId;

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  updatedAt: mongoose.Schema.Types.Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
