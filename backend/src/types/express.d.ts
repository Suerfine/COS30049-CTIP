import { Request } from "express";
import { User } from "../models";

export {};

declare global {
  namespace Express {
    export interface Request {
      user?: User; // Add the user property to the Request interface
    }
  }
}
