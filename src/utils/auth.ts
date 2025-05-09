import jwt from 'jsonwebtoken';
import config from "../config/startup-envs";

// Middleware to generate JWT token
export function tokenGenerator(username: string) {
    return jwt.sign(
        { username: username },
        config.jwtSecret,
        { expiresIn: "4h" }
    )
}


