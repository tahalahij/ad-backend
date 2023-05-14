import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from '../user/user.schema';

export type FileDocument = File & mongoose.Document;

@Schema()
export class File {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  ownerId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.String, required: true })
  path: string;

  @Prop({ type: mongoose.Schema.Types.String, required: true })
  name: string;

  @Prop({ type: mongoose.Schema.Types.String, required: true })
  originalName: string;

  @Prop({ type: mongoose.Schema.Types.String, required: true })
  type: string;

  @Prop({ type: mongoose.Schema.Types.String, required: false })
  animationName: string;

  @Prop({ type: mongoose.Schema.Types.Number, required: false })
  delay: number; // in seconds

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  updatedAt: mongoose.Schema.Types.Date;
}

export const FileSchema = SchemaFactory.createForClass(File);
