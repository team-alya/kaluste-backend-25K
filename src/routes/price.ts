import express, { Response } from "express";
import { analyzePrice } from "../services/ai/priceAnalyzer/perplexity";
import { FurnitureDetailsRequest } from "../types/api";

const router = express.Router();

// Route to analyze price
router.post("/", async (req: FurnitureDetailsRequest, res: Response) => {
  const startTime = Date.now();
  try {
    const { furnitureDetails, serpApiResult } = req.body;
    // const response = getMockPriceData();
    // return res.status(200).json(response);
    const priceEstimate = await analyzePrice(furnitureDetails, serpApiResult);

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
