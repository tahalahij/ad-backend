import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
export type StatisticsDocument = Statistics & mongoose.Document;

@Schema()
export class Statistics {
  @Prop({ type: mongoose.Schema.Types.String })
  ip: string;

  @Prop({ type: mongoose.Schema.Types.String })
  fileType: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'File' })
  fileId: string;

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  updatedAt: mongoose.Schema.Types.Date;
}

export const StatisticsSchema = SchemaFactory.createForClass(Statistics);
