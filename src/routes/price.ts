import express, { Request, Response } from "express";
import { analyzePrice } from "../services/ai/priceAnalyzer/priceFunction";
// import { FurnitureDetailsRequest } from "../types/api";
import { resizeImage } from "@/utils/resizeImage";
import { imageUploadHandler } from "@/middleware/middleware";

const router = express.Router();

router.post("/", imageUploadHandler(), async (req: Request, res: Response) => {
  try {
    const furnitureDetails = JSON.parse(req.body.furnitureDetails);
    const serpApiResult = JSON.parse(req.body.serpApiResult);

    if (!req.file) {
      return res.status(400).json({ error: "File is missing" });
    }

    const optimizedImage = await resizeImage(req.file.buffer);

    console.log("Started price analysis at: " + new Date().toLocaleString())
    const priceEstimate = await analyzePrice(furnitureDetails, serpApiResult, optimizedImage.buffer);

    console.log("Price analysis finished at: " + new Date().toLocaleString() + " sending result")
    return res.json(priceEstimate);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Price analysis failed",
    });
  }
});

export default router;
