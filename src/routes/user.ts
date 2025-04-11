import express, { NextFunction, Request, Response } from "express";
import User from "../middleware/models/user";
import { requiredRole } from "../middleware/roleChecker";
import { CustomError } from "@/types/customError";
import { verifyToken } from "@/middleware/auth";

const router = express.Router();

// Admin muokkaa käyttäjän roolia
router.put(
  "/:id/role",
  verifyToken,
  requiredRole("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Tarkistetaan, että rooli on skeeman mukaan
      const validRoles = ["user", "admin", "expert"];
      if (!validRoles.includes(role)) {
        throw new CustomError("Invalid role specified.", 400);
      }

      const user = await User.findById(id);
      if (!user) {
        throw new CustomError("User not found.", 404);
      }

      user.role = role;
      await user.save();

      return res
        .status(200)
        .json({ message: "Role updated successfully.", user });
    } catch (error) {
      console.error("Error updating user role:", error);
      return next(error);
    }
  }
);

export default router;
