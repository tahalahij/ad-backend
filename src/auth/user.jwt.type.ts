import { RolesType } from './role.type';
import mongoose from 'mongoose';

export type UserJwtPayload = {
  id: string;
  name: string;
  role: RolesType;
};
