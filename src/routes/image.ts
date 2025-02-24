import express, { Request, Response } from "express";
import { imageUploadHandler } from "../middleware/middleware";
import { finalAnalyze } from "../services/ai/generate-objects";
import { runImageAnalysisPipeline } from "../services/ai/pipelines/image-analysis-pipeline";
import { resizeImage } from "../utils/resizeImage";
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
          materials: furnitureData.materiaalit?.map((mat: string) => ({ material: mat })) || [],
          condition: furnitureData.kunto || "Ei tiedossa",
        },
      });

      const savedEvaluation = await newEvaluation.save();
      const checkImage = await Evaluation.findById(savedEvaluation._id);
      console.log("Saved image buffer size:", checkImage?.image.length);
      

      /*
      const newImage = new Evaluation({
        contentType: req.file.mimetype,
        image: optimizedImage.buffer,
      });

      const savedImage = await newImage.save();
      console.log("Image saved to database with ID:", savedImage._id);

      */

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
        contentType: req.file.mimetype,
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

//Find all evaluations
router.get("/all", async (_req, res: Response) => {
  try {
    const evaluations = await Evaluation.find();

    const formattedEvaluations = evaluations.map((evaluation) => ({
      id: evaluation._id,
      contentType: evaluation.contentType,
      timeStamp: evaluation.timeStamp,
      evaluation: evaluation.evaluation,
      image: evaluation.image instanceof Buffer
        ? `data:image/jpeg;base64,${evaluation.image.toString("base64")}`
        : null,
    }));

    return res.json(formattedEvaluations);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return res.status(500).json({ error: "Error fetching evaluations" });
  }
});

// Find evaluation data by id
router.get("/:id", async (req: Request, res: Response) => {
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
