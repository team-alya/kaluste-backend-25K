import express, { NextFunction, Request, Response } from "express";
import User from "../middleware/models/user";
import { requiredRole } from "../middleware/roleChecker";
import { CustomError } from "@/types/customError";
import { verifyToken } from "@/middleware/auth";

const router = express.Router();

/*// Admin muokkaa käyttäjän roolia
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

      console.log("Trying to find user by id...");
      const user = await User.findById(id);
      if (!user) {
        throw new CustomError("User not found.", 404);
      }

      console.log("User found, updating role...");
      user.role = role;
      await user.save();

      console.log("User role updated successfully");
      return res
        .status(200)
        .json({ message: "Role updated successfully.", user });
    } catch (error) {
      console.error("Error updating user role:", error);
      return next(error);
    }
  }
);
*/

// Käyttäjän tietojen muokkaus, ehkä muokkaamalla saisi myös käyttäjälle itse mahdollisuuden muokata joitakin tietoja?
// nyt vain admin muokkaa, tämä laitettu että voi muokata kaikkea tietoa paitsi salasanaa, ylempi vain roolin muokkaus

// Admin hakee kaikki käyttäjät
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

// Admin muokkaa käyttäjän tietoja
router.put(
  "/:id",
  verifyToken,
  requiredRole("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { username, email, firstname, lastname, role } = req.body;
      const user = await User.findById(id, "-password");
      
      if (!user) {
        throw new CustomError("User not found.", 404);
      }     
      console.log("User found, updating...");

      try {
        if (!username && !email && !firstname && !lastname && !role) {
          throw new CustomError("No update data provided", 400);
        }

        if (role) {
          const validRoles = ["user", "admin", "expert"];
          if (!validRoles.includes(role)) {
            throw new CustomError("Invalid role specified.", 400);
          }
        }

        const editUser = {
          username: username || user.username,
          email: email || user.email,
          firstname: firstname || user.firstname,
          lastname: lastname || user.lastname,
          role: role || user.role
        };

        const updatedUser = await User.findByIdAndUpdate(
          id, 
          { ...editUser }, 
          { new: true }
        ).select("-password");
        
        console.log("User updated successfully");
        return res.status(200).json({ 
          message: "User updated successfully.", 
          user: updatedUser
        });
        
      } catch (error) {
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
  }
);

// Admin poistaa käyttäjän
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

// Käyttäjä saa oman tietonsa (testi vain, mahdollisuus tulevaisuudessa)
router.get(
  "/me",
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user;
      const user = await User.findById(userId, "-password");
      if (!user) {
        throw new CustomError("User not found.", 404);
      }
      console.log("User found");
      return res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return next(error);
    }
  }
);

export default router;
