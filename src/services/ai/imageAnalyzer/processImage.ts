import { resizeImage } from "src/utils/resizeImage";
import tempImage from "@/middleware/models/tempImage";
import { serpapi } from "@/services/ai/imageAnalyzer/serpApi_analyzer";
import { chatgptForBrandAndModel } from "@/services/ai/dataAnalyzer/gpt4-Analyzer";
import { chatgptRestOfAnalysis } from "@/services/ai/imageAnalyzer/gpt4-analyzer";
import { FurnitureDetails} from "@/types/schemas";
import { CustomError } from "@/types/customError";
import { analyzePrice } from "@/services/ai/priceAnalyzer/priceFunction";

// This function is used to process the image and analyze it
export const processImageAndAnalyze = async (file: Express.Multer.File) => {
  let optimizedImage: any;
  try {
    console.log("Resizing image...");
    optimizedImage = await resizeImage(file.buffer);
  } catch (error) {
    throw new CustomError("Image resizing failed", 500);
  }

  let savedImageId: string;
  try {
    console.log("Trying to save image to DB...");
    const imageForEvaluation = new tempImage({
      contentType: file.mimetype,
      image: optimizedImage.buffer,
    });
    const savedImage = await imageForEvaluation.save();
    savedImageId = savedImage.id;
    console.log("Saved image successfully, id: " + savedImageId);
  } catch (error) {
    throw new CustomError("Image saving to database failed", 500);
  }

  let serpApiResponse: any;
  try {
    console.log("Passing the ID to SerpAPI...");
    serpApiResponse = await serpapi(savedImageId);
  } catch (error) {
    throw new CustomError("SerpAPI analysis failed", 500);
  }

  let chatgptResponse: any;
  let restGptAnalysis: any;
  try {
    console.log("Passing the SerpAPI response to ChatGPT...");
    [chatgptResponse, restGptAnalysis] = await Promise.all([
      chatgptForBrandAndModel(serpApiResponse),
      chatgptRestOfAnalysis(optimizedImage.buffer),
    ]);
  } catch (error) {
    throw new CustomError("ChatGPT analysis failed", 500);
  }

  let priceEstimation: any;
  try {
    console.log("Analyzing price...");
    priceEstimation = await analyzePrice(restGptAnalysis, chatgptResponse, optimizedImage.buffer);
    console.log("price estimation: ", priceEstimation);
  } catch (error) {
    throw new CustomError("Price analysis failed", 500);
  }

  try {
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

    const priceEstimationFormatted = {
      recommended_price: priceEstimation.recommended_price || 0,
      price_reason: priceEstimation.price_reason || ["Ei tiedossa"]
    };

    return {
      evaluation,
      priceEstimation: priceEstimationFormatted,
      imageId: savedImageId,
    };
  } catch (error) {
    throw new CustomError("Evaluation assembly failed", 500);
  }

};
