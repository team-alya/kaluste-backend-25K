import { Request, Response, NextFunction } from "express";
import { CustomError } from "@/types/customError";

// Middleware to check user roles
// This middleware checks if the user has the required role(s) to access a route
export const requiredRole = (...roles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw new CustomError("Unauthorized", 401);
            }

            if (!roles.includes(req.user.role.toLowerCase())) {
                throw new CustomError("Access denied, insufficient permissions", 403);
            }

            next();

        } catch (error) {
            next(error);
        }
    }
}