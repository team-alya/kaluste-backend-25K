import express, { NextFunction, Request, Response } from 'express';
import User from '../middleware/models/user';
import { tokenGenerator } from '@/utils/auth';
import { CustomError } from '@/types/customError';

const router = express.Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, email, firstname, lastname, role } = req.body;

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      throw new CustomError("This username is already taken.", 400);
    }

    const newUser = new User({ username, password, email, firstname, lastname, role });
    await newUser.save();

    const token = tokenGenerator(newUser.username);
    return res.status(201).json({
      token,
      message: "New user created successfully!",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        role: newUser.role
      }
    })

  } catch (error) {
    return next(error);
  }

})

export default router;
