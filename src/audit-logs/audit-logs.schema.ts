import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { RolesType } from '../auth/role.type';

export type AuditLogDocument = AuditLog & mongoose.Document;

@Schema()
export class AuditLog {
  @Prop({ type: String, trim: true })
  initiatorName: string;

  @Prop({ type: String })
  initiatorId: string;

  @Prop({ type: String, enum: RolesType })
  role: RolesType;

  @Prop({ type: String, trim: true })
  description: string;

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
