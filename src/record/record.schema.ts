import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from '../user/user.schema';
import { RecordTypeEnum } from "./enums/transaction.type.enum";


export type RecordDocument = Record & mongoose.Document;

@Schema()
export class Record {
  @Prop({ type: String, required: true, trim: true, enum: RecordTypeEnum })
  type: RecordTypeEnum;

  @Prop({ type: Number, required: true })
  amount: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  updatedAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  deletedAt: mongoose.Schema.Types.Date;
}

export const RecordSchema = SchemaFactory.createForClass(Record);
