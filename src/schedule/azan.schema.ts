import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { AzanTypeEnum } from './enums/azan.type.enum';

export type AzanDocument = Azan & mongoose.Document;

@Schema()
export class Azan {
  @Prop({ type: Date })
  start: mongoose.Schema.Types.Date; // start of azan

  @Prop({ type: String })
  date: string; // start of day  ('YYYY-MM-DD')

  @Prop({ type: String, enum: AzanTypeEnum })
  type: AzanTypeEnum;

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  updatedAt: mongoose.Schema.Types.Date;
}

export const AzanSchema = SchemaFactory.createForClass(Azan);
