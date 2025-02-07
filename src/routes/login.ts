import express, { Request, Response } from 'express';
import User from '../models/user';
import { tokenGenerator } from '@/utils/auth';

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: "Wrong username or password." })
        }
        const token = tokenGenerator(user.username);
        return res.status(200).json({
            token,
            message: "Logged in successfully!",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })

    } catch (error) {
        return res.status(500).json({ message: "Error while logging in", error: error });
    }
});

export default router;