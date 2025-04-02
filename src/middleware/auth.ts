import jwt, { TokenExpiredError } from 'jsonwebtoken';
import config from "../config/startup-envs";
import { Request, Response, NextFunction } from 'express';
import User from '@/middleware/models/user';
import { CustomError } from '@/types/customError';

export const verifyToken = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];

        if (!token) {
            throw new CustomError("No token provided", 401);
        }

        let decoded;
        try {
            decoded = jwt.verify(token, config.jwtSecret) as { username: string };
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new CustomError("Token expired", 401);
            }
            throw new CustomError("Invalid token", 401);
        }

        const user = await User.findOne({ username: decoded.username }).select("-password -__v")

        if (!user) {
            throw new CustomError("User not found, token is invalid", 401);
        }

        req.user = user;

        next();

    } catch (error) {
        next(error);
    }
}