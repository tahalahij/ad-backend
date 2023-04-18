import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type ConductorDocument = Conductor & mongoose.Document;

@Schema()
export class Conductor {
  // list of files to be shown in order
  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'File' })
  conductor: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: Number })
  nextIndex: number;

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  updatedAt: mongoose.Schema.Types.Date;
}

export const ConductorSchema = SchemaFactory.createForClass(Conductor);
