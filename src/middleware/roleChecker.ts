import { Request, Response, NextFunction } from "express";
import { CustomError } from "@/types/customError";

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

export const checkAdmin = (req: Request,  _res: Response, next: NextFunction) => {
    try {
      const user = req.user; 
  
      if (!user || user.role !== "admin") {
        throw new CustomError("Access denied. Admins only.", 403);
      }
  
      next();
    } catch (error) {
      next(error);
    }
  };

  export const checkExpert = (req: Request, _res: Response, next: NextFunction) => {
    try {
        const user = req.user; 

        if (!user || user.role !== "expert") {
            throw new CustomError("Access denied. Experts only.", 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const checkAdminOrExpert = (req: Request, _res: Response, next: NextFunction) => {
    try {
        const user = req.user; 

        if (!user || (user.role !== "admin" && user.role !== "expert")) {
            throw new CustomError("Access denied. Admins or experts only.", 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};