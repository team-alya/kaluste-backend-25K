import express, { NextFunction, Request, Response } from 'express';
import User from '../middleware/models/user';
import { tokenGenerator } from '@/utils/auth';
import { CustomError } from '@/types/customError';

const router = express.Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user || !(await user.comparePassword(password))) {
            throw new CustomError("Wrong username or password.", 401)
        }
        const token = tokenGenerator(user.username);
        return res.status(200).json({
            token,
            message: "Logged in successfully!",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                role: user.role
            }
        })

    } catch (error) {
        return next(error);
    }
});

export default router;