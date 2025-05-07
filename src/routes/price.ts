import express, { Request, Response } from "express";
import { analyzePrice } from "../services/ai/priceAnalyzer/priceFunction";
// import { FurnitureDetailsRequest } from "../types/api";
import { resizeImage } from "@/utils/resizeImage";
import { imageUploadHandler } from "@/middleware/middleware";

const router = express.Router();

// Route to analyze price
router.post("/", imageUploadHandler(), async (req: Request, res: Response) => {
  try {
    const furnitureDetails = JSON.parse(req.body.furnitureDetails);
    const serpApiResult = JSON.parse(req.body.serpApiResult);

    if (!req.file) {
      return res.status(400).json({ error: "File is missing" });
    }

    const optimizedImage = await resizeImage(req.file.buffer);

    const priceEstimate = await analyzePrice(furnitureDetails, serpApiResult, optimizedImage.buffer);
    const startTime = Date.now();
    console.log(`Price analysis finished in: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`)
    return res.json(priceEstimate);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Price analysis failed",
    });
  }
});

export default router;
