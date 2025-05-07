import express, { NextFunction, Request, Response } from "express";
import { imageUploadHandler } from "../middleware/middleware";
import tempImage from "@/middleware/models/tempImage";
import { CustomError } from "@/types/customError";
import Image from "@/middleware/models/image";
import { verifyToken } from "@/middleware/auth";
import { requiredRole } from "@/middleware/roleChecker";
import { processImageAndAnalyze } from "@/services/ai/processImage";

const router = express.Router();

// Upload image for evaluation
router.post(
  "/",
  verifyToken,
  requiredRole("user", "expert", "admin"),
  imageUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    // Global variable to store the saved image ID
    let savedImageId = "";
    // Start the timer to measure the duration of the analysis
    const startTime = Date.now();
    try {
      // Check if the image file is provided
      if (!req.file || !req.file.buffer) {
        throw new CustomError("No image file provided", 400);
      }
      // Run the image through the pipeline for analysis
      const { evaluation, priceEstimation, imageId } =
        await processImageAndAnalyze(req.file);
      savedImageId = imageId;
      // Return the evaluation and price estimation results
      return res.json({ evaluation, priceEstimation });
    } catch (error) {
      console.error("Pipeline error:", error);
      return next(error);
    } finally {
      // Cleanup: delete the tempImage from the database after processing
      if (savedImageId) {
        try {
          await tempImage.findByIdAndDelete(savedImageId);
          console.log("Image deleted successfully.");
          console.log(
            `Analysis finished in ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`
          );
        } catch (deleteError) {
          console.error("Error deleting image:", deleteError);
          next(deleteError);
        }
      }
    }
  }
);

// Find evaluation tempImage by id for serpApi search
router.get(
  "/serpapi/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const image = await tempImage.findById(req.params.id);
      if (!image) {
        throw new CustomError("Image not found", 404);
      }
      res.setHeader("Content-Type", image.contentType);
      return res.send(image.image);
    } catch (error) {
      console.error("Error fetching image:", error);
      return next(error);
    }
  }
);

// Find evaluation image by id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      throw new CustomError("Image not found", 404);
    }

    res.setHeader("Content-Type", image.contentType);
    return res.send(image.image);
  } catch (error) {
    console.error("Error fetching image:", error);
    return next(error);
  }
});

export default router;
