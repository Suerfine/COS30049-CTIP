import {User} from "../models";

declare global {
    namespace Express {
        interface Request {
            user?: User; // Add the user property to the Request interface
        }
    }
}