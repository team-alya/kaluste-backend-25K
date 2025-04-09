import express, { Request, Response } from "express";
import { GPT4Analyzer } from "../services/ai/imageAnalyzer/photoAnalyzer";
import { imageUploadHandler, imageValidator } from "../middleware/middleware";
import { requiredRole } from "@/middleware/roleChecker";
import { verifyToken } from "@/middleware/auth";

const router = express.Router();
const gpt4Analyzer = new GPT4Analyzer();

router.post(
  "/",
  imageUploadHandler(),
  verifyToken,
  requiredRole("customer", "expert", "admin"),
  imageValidator,
  async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const photo = req.file.buffer;

      const analysisResult = await gpt4Analyzer.analyzePhotoQuality(photo);
      console.log("Photo analysis result:", analysisResult);

      return res.json(analysisResult);
    } catch (error) {
      console.error("Error in photo analysis route:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Photo analysis failed",
      });
    }
  }
);

export default router;
