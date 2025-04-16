import { resizeImage } from "src/utils/resizeImage"; 
import tempImage from "@/middleware/models/tempImage";
import { serpapi } from "@/services/ai/imageAnalyzer/serpApi_analyzer";
import { chatgptForBrandAndModel } from "@/services/ai/dataAnalyzer/gpt4-Analyzer";
import { chatgptRestOfAnalysis } from "@/services/ai/imageAnalyzer/gpt4-analyzer";
import { analyzePrice } from "@/services/ai/priceAnalyzer/perplexity";
import { FurnitureDetails } from "@/types/schemas";
import { NextFunction } from "express";
import { CustomError } from "@/types/customError";

export const processImageAndAnalyze = async (file: Express.Multer.File, next: NextFunction) => {
  try {
    console.log("Resizing image...");
    const optimizedImage = await resizeImage(file.buffer);

    try {
      console.log("trying to save image to db");
      const imageForEvaluation = new tempImage({
        contentType: file.mimetype,
        image: optimizedImage.buffer,
      });
      const savedImage = await imageForEvaluation.save();
      const savedImageId = savedImage.id;
      console.log("saved image successfully, id: " + savedImageId);

      try {
        console.log("pass the id to serpapi");
        const serpApiResponse = await serpapi(savedImageId);
        console.log("pass the serpapi response to chatgpt");
        const [chatgptResponse, restGptAnalysis] = await Promise.all([
          chatgptForBrandAndModel(serpApiResponse),
          chatgptRestOfAnalysis(optimizedImage.buffer),
        ]);

        const evaluation: FurnitureDetails = {
          merkki: chatgptResponse.merkki || "Ei tiedossa",
          malli: chatgptResponse.malli || "Ei tiedossa",
          vari: restGptAnalysis.vari || "Ei tiedossa",
          mitat: {
            pituus: restGptAnalysis.mitat?.pituus ?? 0,
            leveys: restGptAnalysis.mitat?.leveys ?? 0,
            korkeus: restGptAnalysis.mitat?.korkeus ?? 0,
          },
          materiaalit: restGptAnalysis.materiaalit || [],
          kunto: restGptAnalysis.kunto || "Ei tiedossa",
        };

        const priceEstimation = await analyzePrice(restGptAnalysis, chatgptResponse);

        return {
          evaluation,
          priceEstimation,
          savedImageId,
        };
      } catch (error) {
        console.error("Pipeline error:", error);
        return next(new CustomError("Pipeline error", 500));
      }
    } catch (error) {
      console.error("Image handling failed: ", error);
      return next(new CustomError("Image hanlding failed", 500))
    }
  } catch (error) {
    console.log("Error in image processing pipeline:", error);
    return next(new CustomError("Error in image processing", 500));
  }
};