import jwt from 'jsonwebtoken';
import config from "../config/startup-envs";
import { NextFunction, Request, Response } from 'express';
import User from '@/models/user';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, config.jwtSecret) as { username: string };
        const user = await User.findOne({ username: decoded.username })

        if (!user) {
            return res.status(401).json({ message: "Invalid token, user not found" });
        }

        return next();

    } catch (error) {
        return res.status(401).json({ message: "Token is not valid" });
    }
}