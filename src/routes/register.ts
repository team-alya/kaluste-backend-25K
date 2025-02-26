import express, { Request, Response } from "express";
import User from "../middleware/models/user";
import { tokenGenerator } from "@/utils/auth";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { username, password, email, firstname, lastname, role } = req.body;

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res
        .status(400)
        .json({
          message: "Username is taken, please choose a different username",
        });
    }

    const newUser = new User({
      username,
      password,
      email,
      firstname,
      lastname,
      role,
    });
    await newUser.save();

    const token = tokenGenerator(newUser.username);
    return res.status(201).json({
      token,
      message: "New user created successfully!",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error while trying to register", error: error });
  }
});

export default router;
