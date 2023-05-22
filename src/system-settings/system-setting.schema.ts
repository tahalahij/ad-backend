import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SystemSettingsEnum } from './enum/system-settings.enum';

export type SystemSettingDocument = SystemSetting & mongoose.Document;

@Schema()
export class SystemSetting {
  @Prop({ type: String, required: true, trim: true })
  name: SystemSettingsEnum;

  @Prop({ type: String, required: false })
  value: string;

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  updatedAt: mongoose.Schema.Types.Date;
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting);
