import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { WeekDays } from './enums/week.enum';
import { ScheduleTypeEnum } from './enums/schedule.type.enum';

export type ScheduleDocument = Schedule & mongoose.Document;

@Schema()
class PointInTime {
  @Prop()
  hour: number;

  @Prop()
  minute: number;
}
@Schema()
export class Schedule {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  operator: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Conductor', required: true })
  conductor: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true })
  deviceId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string; // name of schedule

  @Prop({ type: String, required: true })
  ip: string; // redundancy of device id, used for performance and not querying db for device

  @Prop({ type: String, enum: ScheduleTypeEnum })
  type: ScheduleTypeEnum; // if RECURSIVE then use the (from , to , day) if ONE_TIME then use (start, end)

  @Prop({ type: [String], enum: WeekDays })
  day: [WeekDays];

  @Prop({ type: PointInTime })
  from: PointInTime;

  @Prop({ type: PointInTime })
  to: PointInTime;

  @Prop({ type: Date })
  start: mongoose.Schema.Types.Date;

  @Prop({ type: Date })
  end: mongoose.Schema.Types.Date;

  @Prop({ type: Date, required: true })
  createdAt: mongoose.Schema.Types.Date;

  @Prop({ type: Date, default: null })
  updatedAt: mongoose.Schema.Types.Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
