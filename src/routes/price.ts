import express, { Response } from "express";
import { analyzePrice } from "../services/ai/priceAnalyzer/perplexity";
import { FurnitureDetailsRequest } from "../types/api";

const router = express.Router();

router.post("/", async (req: FurnitureDetailsRequest, res: Response) => {
  try {
    const { furnitureDetails, serpApiResult } = req.body;
    // const response = getMockPriceData();
    // return res.status(200).json(response);
    console.log("Started price analysis at: " + new Date().toLocaleString())
    const priceEstimate = await analyzePrice(furnitureDetails, serpApiResult);

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
