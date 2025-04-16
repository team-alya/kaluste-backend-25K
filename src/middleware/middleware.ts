import { NextFunction, Request, Response } from "express";
import multer from "multer";

// Middleware to handle image uploads
// This middleware uses multer to handle image uploads
export const imageUploadHandler = () => {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      fieldSize: 50 * 1024 * 1024, // 50MB
    },
  }).single("image");
};
// Middleware to validate image uploads
// This middleware checks if the uploaded file is an image
export const imageValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Image was not included in the request" });
    }
    if (!req.file.mimetype.includes("image")) {
      return res.status(400).json({ error: "Uploaded file is not an image" });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.json({ error: error.message });
    }
  }
  return next();
};
