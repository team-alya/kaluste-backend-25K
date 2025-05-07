import express, { NextFunction, Request, Response } from "express";
import User from "../middleware/models/user";
import { requiredRole } from "../middleware/roleChecker";
import { CustomError } from "@/types/customError";
import { verifyToken } from "@/middleware/auth";
import { tokenGenerator } from "@/utils/auth";

const router = express.Router();

// Get all users
router.get(
  "/",
  verifyToken,
  requiredRole("admin"),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Fetching all users...");
      const users = await User.find({}).select("-password"); // selectin poistamalla saa salasanan näkyville
      console.log("Users fetched successfully");
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return next(error);
    }
  }
);
// Get user by id
router.get(
  "/:id",
  verifyToken,
  requiredRole("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const users = await User.findById(id, "-password"); // selectin poistamalla saa salasanan näkyville
      console.log("User fetched successfully");
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return next(error);
    }
  }
);

// Edit user

router.put(
  "/:id",
  verifyToken,
  requiredRole("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { username, email, firstname, lastname, role } = req.body;

      const errors: { [key: string]: string } = {};

      if (!username && !email && !firstname && !lastname && !role) {
        errors.update = "Ei päivitettävää tietoa.";
        throw new CustomError("Ei päivitettävää tietoa.", 400);
      }

      const user = await User.findById(id, "-password");
      if (!user) {
        errors.user = "Käyttäjää ei löytynyt.";
        throw new CustomError("Käyttäjää ei löytynyt.", 404);
      }

      if (username && username !== user?.username) {
        const existingUser = await User.findOne({
          username: { $regex: `^${username}$`, $options: "i" },
          _id: { $ne: id },
        });
        if (existingUser) {
          errors.username = "Käyttäjätunnus on jo käytössä.";
          throw new CustomError("Käyttäjätunnus on jo käytössä.", 400);
        }
      }

      if (email && email !== user?.email) {
        const existingEmail = await User.findOne({
          email: { $regex: `^${email}$`, $options: "i" },
          _id: { $ne: id },
        });
        if (existingEmail) {
          errors.email = "Sähköpostiosoite on jo käytössä.";
          throw new CustomError("Sähköpostiosoite on jo käytössä.", 400);
        }
      }

      if (role) {
        const validRoles = ["user", "admin", "expert"];
        if (!validRoles.includes(role)) {
          errors.role = "Kyseistä roolia ei ole.";
          throw new CustomError("Kyseistä roolia ei ole.", 400);
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
      }

      const editUser = {
        username: username || user?.username,
        email: email || user?.email,
        firstname: firstname || user?.firstname,
        lastname: lastname || user?.lastname,
        role: role || user?.role,
      };

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { ...editUser },
        { new: true }
      ).select("-password");

      return res.status(200).json({
        message: "Käyttäjätiedot on päivitetty onnistuneesti.",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Virhe päivittäessä käyttäjätietoja", error);
      return next(error);
    }
  }
);

// Delete user

router.delete(
  "/:id",
  verifyToken,
  requiredRole("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      console.log("Trying to find user by id...");
      const user = await User.findById(id);
      if (!user) {
        throw new CustomError("User not found.", 404);
      }
      console.log("User found, deleting...");
      await user.deleteOne();
      console.log("User deleted successfully");
      return res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Error deleting user:", error);
      return next(error);
    }
  }
);

// Register new user

router.post("/register", verifyToken, requiredRole("admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, email, firstname, lastname, role } = req.body;

    const errors: { [key: string]: string } = {};

    const existingUser = await User.findOne({ username: { $regex: `^${username}$`, $options: "i" } });
    if (existingUser) {
      errors.username = "Tämä käyttäjätunnus on jo käytössä.";
    }

    const existingEmail = await User.findOne({ email: { $regex: `^${email}$`, $options: "i" } });
    if (existingEmail) {
      errors.email = "Tämä sähköpostiosoite on jo käytössä.";
    }

    const passwordTooShort = password.length < 6;
    if (passwordTooShort) {
      errors.password = "Salasanan pituuden tulee olla vähintään 6 merkkiä.";
    }
    // Tarkista, onko rooli kelvollinen
    if (role) {
      const validRoles = ["user", "admin", "expert"];
      if (!validRoles.includes(role)) {
        errors.role = "Kyseinen rooli ei ole sallittu.";
      }
    }

    // Jos virheitä on, palautetaan ne
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const newUser = new User({ username, password, email, firstname, lastname, role });
    await newUser.save();

    const token = tokenGenerator(newUser.username);
    return res.status(201).json({
      token,
      message: "Uusi käyttäjä luotu onnistuneesti.",
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
