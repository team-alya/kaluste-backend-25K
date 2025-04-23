import { NextFunction, Request, Response } from "express";

// Middleware to set a timeout for requests and responses
// This middleware sets a timeout of 3 minutes (180000 milliseconds) for requests and responses
export const timeout = (req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(180000); // 3min
  res.setTimeout(180000); // 3min
  next();
};
