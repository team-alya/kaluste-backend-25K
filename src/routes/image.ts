import express, { Request, Response } from "express";
import { imageUploadHandler } from "../middleware/middleware";
import { finalAnalyze } from "../services/ai/generate-objects";
import { runImageAnalysisPipeline } from "../services/ai/pipelines/image-analysis-pipeline";
import { resizeImage } from "../utils/resizeImage";
import { BaseResponse } from "serpapi";
import { serpapi } from "@/services/ai/imageAnalyzer/serpApi_analyzer";
import {
  chatgptForBrandAndModel,
  chatgptRestOfAnalysis,
} from "@/services/ai/chatgpt";
import Evaluation from "@/middleware/models/evaluation";
import Image from "@/middleware/models/imageSchema";
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
      };

      const newEvaluation = new Evaluation({
        contentType: req.file.mimetype,
        image: optimizedImage.buffer,
        evaluation: {
          brand: furnitureData.merkki || "Ei tiedossa",
          model: furnitureData.malli || "Ei tiedossa",
          color: furnitureData.vari || "Ei tiedossa",
          dimensions: {
            length: furnitureData.mitat?.pituus || 0,
            width: furnitureData.mitat?.leveys || 0,
            height: furnitureData.mitat?.korkeus || 0,
          },
          materials:
            furnitureData.materiaalit?.map((mat: string) => ({
              material: mat,
            })) || [],
          condition: furnitureData.kunto || "Ei tiedossa",
        },
      });

      const savedEvaluation = await newEvaluation.save();
      const checkImage = await Evaluation.findById(savedEvaluation._id);
      console.log("Saved image buffer size:", checkImage?.image.length);
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

interface VisualMatch {
  position: string;
  title: string;
}

router.post(
  "/imagetest",
  imageUploadHandler(),
  async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const optimizedImage = await resizeImage(req.file.buffer);

      try {
        console.log("trying to save img");

        const imageForEvaluation = new Image({
          contentType: req.file.mimetype,
          image: optimizedImage.buffer,
        });

        const savedImage = await imageForEvaluation.save();
        console.log("saved image id: " + savedImage.id);

        const serpApiResponse: BaseResponse = await serpapi(savedImage.id);

        const trimmedSerpApiResponse: VisualMatch[] =
          serpApiResponse.visual_matches
            .map((match: VisualMatch) => ({
              position: match.position,
              title: match.title,
            }))
            .slice(0, 10);

        const chatgptResponse = await chatgptForBrandAndModel(
          trimmedSerpApiResponse
        );
        console.log(trimmedSerpApiResponse);

        console.log("Start rest of analysis");
        const restGptAnalysis = await chatgptRestOfAnalysis(
          optimizedImage.buffer
        );
        console.log(restGptAnalysis);

        const updatedEvaluation = {
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

        await Image.findByIdAndDelete(savedImage.id);
        return res.json(updatedEvaluation);
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
  }
);

// Find evaluation image by id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.setHeader("Content-Type", image.contentType);
    return res.send(image.image);
  } catch (error) {
    console.error("Error fetching image:", error);
    return res.status(500).json({ error: "Error fetching image" });
  }
});

/*
// For testing serpApi:
router.post(
  "/imagetest",
  imageUploadHandler(),
  async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const optimizedImage = await resizeImage(req.file.buffer);

      try {
        console.log("trying to save img");

        const firstEvaVersion = new Evaluation({
          contentType: req.file.mimetype,
          image: optimizedImage.buffer,
        });

        const savedFirstEvaluation = await firstEvaVersion.save();
        console.log(
          "saving was successfull. Evaluation id:" + savedFirstEvaluation.id
        );
        console.log("pass the id to serpapi");

        const serpApiResponse: BaseResponse = await serpapi(
          savedFirstEvaluation.id
        );
        const chatgptResponse = await chatgpt(serpApiResponse);
        console.log(chatgptResponse);

        const updatedEvaluation = {
          contentType: req.file.mimetype,
          image: optimizedImage.buffer,
          evaluation: {
            brand: chatgptResponse.merkki,
            model: chatgptResponse.malli,
            color: "Ei tiedossa",
            dimensions: {
              length: 0,
              width: 0,
              height: 0,
            },
            materials: [],
            condition: "Ei tiedossa",
          },
        };

        const finalEvaVersion = await Evaluation.findByIdAndUpdate(
          savedFirstEvaluation.id,
          updatedEvaluation,
          { new: true }
        );

        return res.json(finalEvaVersion);
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
  }
);
// Find evaluation image by id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const image = await Evaluation.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.setHeader("Content-Type", image.contentType);
    return res.send(image.image);
  } catch (error) {
    console.error("Error fetching image:", error);
    return res.status(500).json({ error: "Error fetching image" });
  }
});

router.get("/eva/:id", async (req: Request, res: Response) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }

    let base64Image = null;
    if (evaluation.image && evaluation.image.buffer) {
      base64Image = `data:image/jpeg;base64,${evaluation.image.toString("base64")}`;
    }

    return res.json({
      id: evaluation._id,
      contentType: evaluation.contentType,
      timeStamp: evaluation.timeStamp,
      evaluation: evaluation.evaluation,
      image: base64Image,
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return res.status(500).json({ error: "Error fetching image" });
  }
});

// Find all evaluations
router.get("/all", async (_req, res: Response) => {
  try {
    const evaluations = await Evaluation.find();

    const formattedEvaluations = evaluations.map((evaluation) => ({
      id: evaluation._id,
      contentType: evaluation.contentType,
      timeStamp: evaluation.timeStamp,
      evaluation: evaluation.evaluation,
      image:
        evaluation.image instanceof Buffer
          ? `data:image/jpeg;base64,${evaluation.image.toString("base64")}`
          : null,
    }));

    return res.json(formattedEvaluations);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return res.status(500).json({ error: "Error fetching evaluations" });
  }
});
*/

export default router;
