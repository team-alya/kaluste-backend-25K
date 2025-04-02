import { UserDocument } from "@/middleware/models/user";

declare global {
    namespace Express {
        interface Request {
            user?: UserDocument
        }
    }
}