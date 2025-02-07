import express, { Request, Response } from "express";
import { imageUploadHandler } from "../middleware/middleware";
import { finalAnalyze } from "../services/ai/generate-objects";
import { runImageAnalysisPipeline } from "../services/ai/pipelines/image-analysis-pipeline";
import { resizeImage } from "../utils/resizeImage";
import Image from "@/models/imageSchema";
import { BaseResponse } from "serpapi";
import { serpapi } from "@/services/ai/imageAnalyzer/serpApi_analyzer";
import { chatgpt } from "@/services/ai/chatgpt";
import Evaluation from "@/models/evaluation";
//import fs from "fs";

const router = express.Router();

router.post("/", imageUploadHandler(), async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const optimizedImage = await resizeImage(req.file.buffer);

    try {
      let furnitureData = await runImageAnalysisPipeline(optimizedImage.buffer);

      if (!furnitureData.merkki || furnitureData.merkki === "Ei tiedossa") {
        console.log("Brand missing, attempting final analysis...");
        try {
          const finalResult = await finalAnalyze(optimizedImage.buffer);
          // Päivitetään vain merkki ja malli. Muuten käytetään furniterDataa analyysia sellaisenaan.
          furnitureData = {
            ...furnitureData,
            merkki: finalResult.merkki,
            malli: finalResult.malli,
          };
        } catch (analyzeError) {
          console.error("Final analysis error:", analyzeError);
        }
      }

      const responseData = {
        ...furnitureData,
        requestId: crypto.randomUUID(),
      };

      const newImage = new Image({
        filename: `${responseData.requestId}-image`,
        contentType: req.file.mimetype,
        image: optimizedImage.buffer,
      });

      const savedImage = await newImage.save();
      console.log("Image saved to database with ID:", savedImage._id);

      console.log("returning response data");

      return res.status(200).json(responseData);
    } catch (error) {
      console.error("Pipeline error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Analysis pipeline failed";
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("Server error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(500).json({ error: errorMessage });
  }
});

/*router.get("/:id", async (req: Request, res: Response) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    
    // Tallennetaan kuva tiedostoon
    fs.writeFileSync(`./${image.filename}.jpeg`, image.image);

    return res.status(200).json({ message: "Image saved to file" });
  } catch (error) {
    console.error("Error fetching image:", error);
    return res.status(500).json({ error: "Error fetching image" });
  }
});
*/

// For testing serpApi:
router.get("/test", async (_req: Request, res: Response) => {
  const response: BaseResponse = await serpapi();
  const chatgptResponse = await chatgpt(response);
  return res.json(chatgptResponse);
});

// For testing adding evaluation object database:
router.post(
  "/test",
  imageUploadHandler(),
  async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const optimizedImage = await resizeImage(req.file.buffer);

      const imageForEvaluation = new Evaluation({
        image: optimizedImage.buffer,
      });

      const evaResult = await imageForEvaluation.save();
      return res.status(200).json(evaResult);
    } catch (error) {
      console.error("Pipeline error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Analysis pipeline failed";
      throw new Error(errorMessage);
    }
  }
);

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Asetetaan Content-Type otsikko
    res.setHeader("Content-Type", image.contentType);

    // Lähetetään kuva vastauksena
    return res.send(image.image);
  } catch (error) {
    console.error("Error fetching image:", error);
    return res.status(500).json({ error: "Error fetching image" });
  }
});

export default router;

/*
[
  {
    id:23423423,
    image: {kuvabufferi},
    arvio: {
      malli:null,
      merkki:null,
    }
  }
*/
