import {
  ChatGptAnalysisResult,
  FurnitureDetails,
  OptimizedImage,
  PriceEstimation,
} from "@/types/schemas";
import {
  handleChatGptAnalysis,
  handleImage,
  handlePriceAnalysis,
  handleSaveTempImage,
  handleSerpApiAnalysis,
} from "@/utils/helperFunctions";
import { BaseResponse } from "serpapi";

export const processImageAndAnalyze = async (file: Express.Multer.File) => {
  // Resize the image to a smaller size for analysis
  const optimizedImage: OptimizedImage = await handleImage(file);

  // Save the resized image to the database temporarily
  const tempImageId = await handleSaveTempImage(optimizedImage, file);

  // Perform analysis using SerpAPI and ChatGPT
  const serpApiData: BaseResponse = await handleSerpApiAnalysis(tempImageId);

  const { chatgptResponse, restGptAnalysis }: ChatGptAnalysisResult =
    await handleChatGptAnalysis(serpApiData, optimizedImage);

  // Get price estimation using the analysis results and the image buffer
  const priceEstimation: PriceEstimation = await handlePriceAnalysis(
    restGptAnalysis,
    chatgptResponse,
    optimizedImage.buffer
  );

  // Construct the evaluation object with the analysis results
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

  return {
    evaluation,
    priceEstimation,
    imageId: tempImageId,
  };
};
