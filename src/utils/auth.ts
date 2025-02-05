import jwt from 'jsonwebtoken';
import config from "../config/startup-envs";


export function tokenGenerator(username: string) {
    return jwt.sign(
        { username: username },
        config.jwtSecret,
        { expiresIn: "4h" }
    )
}

export function verifyToken(token: string) {
    return jwt.verify(token, config.jwtSecret)
}

