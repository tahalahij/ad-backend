import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { File } from './file.schema';

export type ScheduleDocument = Schedule & mongoose.Document;

@Schema()
export class Schedule {
  @Prop({ type: mongoose.Schema.Types.String, required: true })
  ip: string;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'File' })
  conductor: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  lastShown: mongoose.Schema.Types.ObjectId;

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  updatedAt: mongoose.Schema.Types.Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
