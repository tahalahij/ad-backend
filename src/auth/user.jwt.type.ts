import { RolesType } from "./role.type";
import mongoose from "mongoose";

export  type UserJwtPayload  = {
  id:  mongoose.Types.ObjectId | string,
  name: string,
  role: RolesType,
}
