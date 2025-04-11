import { resizeImage } from "src/utils/resizeImage";
import tempImage from "@/middleware/models/tempImage";
import { serpapi } from "@/services/ai/imageAnalyzer/serpApi_analyzer";
import { chatgptForBrandAndModel } from "@/services/ai/dataAnalyzer/gpt4-Analyzer";
import { chatgptRestOfAnalysis } from "@/services/ai/imageAnalyzer/gpt4-analyzer";
//import { analyzePrice } from "@/services/ai/priceAnalyzer/perplexity";
//import {
//NewFurnitureDetails,
// newFurnitureDetailsSchema,
//} from "@/types/schemas";

export const processImageAndAnalyze = async (file: Express.Multer.File) => {
  const optimizedImage = await resizeImage(file.buffer);

  console.log("trying to save image to db");
  const imageForEvaluation = new tempImage({
    contentType: file.mimetype,
    image: optimizedImage.buffer,
  });

  const savedImage = await imageForEvaluation.save();
  const savedImageId = savedImage.id;
  console.log("saved image successfully, id: " + savedImageId);

  console.log("pass the id to serpapi");
  const serpApiResponse = await serpapi(savedImageId);

  console.log("pass the serpapi response to chatgpt");
  const [chatgptResponse, restGptAnalysis] = await Promise.all([
    chatgptForBrandAndModel(serpApiResponse),
    chatgptRestOfAnalysis(optimizedImage.buffer),
  ]);

  return {
    evaluation: {
      brand: chatgptResponse.merkki || "Ei tiedossa",
      model: chatgptResponse.malli || "Ei tiedossa",
      color: restGptAnalysis.vari,
      dimensions: {
        length: restGptAnalysis.mitat?.pituus ?? 0,
        width: restGptAnalysis.mitat?.leveys ?? 0,
        height: restGptAnalysis.mitat?.korkeus ?? 0,
      },
      materials: restGptAnalysis.materiaalit,
      condition: restGptAnalysis.kunto,
    },
    savedImageId,
  };
};
