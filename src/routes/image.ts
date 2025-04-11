import express, { NextFunction, Request, Response } from "express";
import { imageUploadHandler } from "../middleware/middleware";
import { resizeImage } from "../utils/resizeImage";
import { BaseResponse } from "serpapi";
import { serpapi } from "@/services/ai/imageAnalyzer/serpApi_analyzer";
import tempImage from "@/middleware/models/tempImage";
import { chatgptForBrandAndModel } from "@/services/ai/dataAnalyzer/gpt4-Analyzer";
import { CustomError } from "@/types/customError";
import { chatgptRestOfAnalysis } from "@/services/ai/imageAnalyzer/gpt4-analyzer";
import { scrapingDog } from "@/services/ai/imageAnalyzer/scrapingdog";
import Image from "@/middleware/models/image";
import { verifyToken } from "@/middleware/auth";
import { requiredRole } from "@/middleware/roleChecker";

const router = express.Router();

router.post(
  "/",
  verifyToken,
  requiredRole("user", "expert", "admin"),
  imageUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    let savedImageId: string = "";
    try {
      console.log("Started analysis at: " + new Date().toLocaleString());
      if (!req.file || !req.file.buffer) {
        throw new CustomError("No image file provided", 400);
      }

      const optimizedImage = await resizeImage(req.file.buffer);

      try {
        console.log("trying to save image to db");

        const imageForEvaluation = new tempImage({
          contentType: req.file.mimetype,
          image: optimizedImage.buffer,
        });

        const savedImage = await imageForEvaluation.save();
        savedImageId = savedImage.id;
        console.log("saved image successfully, id: " + savedImageId);

        try {
          console.log("pass the id to serpapi");
          const serpApiResponse: BaseResponse = await serpapi(savedImageId);

          console.log("pass the serpapi response to chatgpt");
          const [chatgptResponse, restGptAnalysis] = await Promise.all([
            chatgptForBrandAndModel(serpApiResponse),
            chatgptRestOfAnalysis(optimizedImage.buffer),
          ]);

          const evaluation = {
            evaluation: {
              brand: chatgptResponse.merkki || "Ei tiedossa",
              model: chatgptResponse.malli || "Ei tiedossa",
              color: restGptAnalysis.vari || "Ei tiedossa",
              dimensions: {
                length: restGptAnalysis.mitat.pituus || 0,
                width: restGptAnalysis.mitat.leveys || 0,
                height: restGptAnalysis.mitat.korkeus || 0,
              },
              materials: restGptAnalysis.materiaalit || [],
              condition: restGptAnalysis.kunto || "Ei tiedossa",
            },
          };
          return res.json(evaluation);
        } catch (error) {
          console.error("Pipeline error:", error);
          return next(error);
        }
      } catch (error) {
        console.error("Image handling failed: ", error);
        return next(error);
      }
    } catch (error) {
      console.error("Server error:", error);
      return next(error);
    } finally {
      if (savedImageId !== "") {
        try {
          console.log("delete the image from db");
          await tempImage.findByIdAndDelete(savedImageId);
          console.log("Image deleted successfully.");
          console.log("Analysis finished at: " + new Date().toLocaleString());
        } catch (deleteError) {
          console.error("Error deleting image:", deleteError);
          next(deleteError);
        }
      }
    }
  }
);

// Find evaluation image by id for serpApi search
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

router.post(
  "/scraping",
  imageUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    let savedImageId: string = "";
    try {
      if (!req.file || !req.file.buffer) {
        throw new CustomError("Image file not provided", 400);
      }
      const optimizedImage = await resizeImage(req.file.buffer);
      try {
        console.log("trying to save image to db");

        const imageForEvaluation = new tempImage({
          contentType: req.file.mimetype,
          image: optimizedImage.buffer,
        });

        const savedImage = await imageForEvaluation.save();
        savedImageId = savedImage.id;
        console.log("saved image successfully, id: " + savedImageId);

        try {
          const scrapingApiResponse = await scrapingDog(savedImageId);
          console.log(scrapingApiResponse);

          const chatgptResponse =
            await chatgptForBrandAndModel(scrapingApiResponse);

          const evaluation = {
            evaluation: {
              brand: chatgptResponse.merkki || "Ei tiedossa",
              model: chatgptResponse.malli || "Ei tiedossa",
            },
          };

          return res.json(evaluation);
        } catch (error) {
          console.error("Pipeline error:", error);
          return next(error);
        }
      } catch (error) {
        console.error("Image handling failed: ", error);
        return next(error);
      }
    } catch (error) {
      console.error("Server error:", error);
      return next(error);
    } finally {
      if (savedImageId !== "") {
        try {
          console.log("delete the image from db");
          await tempImage.findByIdAndDelete(savedImageId);
          console.log("Image deleted successfully.");
        } catch (deleteError) {
          console.error("Error deleting image:", deleteError);
          next(deleteError);
        }
      }
    }
  }
);

export default router;
