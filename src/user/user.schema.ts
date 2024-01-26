import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { RolesType } from '../auth/role.type';

export type UserDocument = User & mongoose.Document;

@Schema()
export class User {
  @Prop({ type: String, required: true, trim: true, unique: true })
  username: string;

  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: Boolean, required: false, default: true })
  enabled: boolean;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: false })
  ip: string;


  @Prop({ type: String, required: false })
  mac: string;

  @Prop({ type: String, enum: RolesType, required: true })
  role: RolesType;

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  updatedAt: mongoose.Schema.Types.Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
