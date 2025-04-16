import express, { NextFunction, Request, Response } from "express";
import { GPT4Analyzer } from "../services/ai/imageAnalyzer/photoAnalyzer";
import { imageUploadHandler, imageValidator } from "../middleware/middleware";
import { CustomError } from "@/types/customError";
import { requiredRole } from "@/middleware/roleChecker";
import { verifyToken } from "@/middleware/auth";

const router = express.Router();
const gpt4Analyzer = new GPT4Analyzer();

router.post(
  "/",
  imageUploadHandler(),
  verifyToken,
  requiredRole("user", "expert", "admin"),
  imageValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    try {
      if (!req.file || !req.file.buffer) {
        throw new CustomError("No image file provided", 400);
      }

      const photo = req.file.buffer;
      console.log("Starting photo quality analysis...")
      const analysisResult = await gpt4Analyzer.analyzePhotoQuality(photo);
      console.log("Photo analysis result:", analysisResult);

      console.log(`Analysis finished in ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`)
      return res.json(analysisResult);
    } catch (error) {
      console.error("Error in photo analysis route:", error);
      return next(error);
    }
  }
);

export default router;
