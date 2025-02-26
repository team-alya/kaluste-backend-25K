import Evaluation from "@/middleware/models/evaluation";
import express, { Request, Response } from "express";
import { imageUploadHandler } from "../middleware/middleware";
import { resizeImage } from "../utils/resizeImage";

const router = express.Router();

export default router;

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

router.post(
  "/save",
  imageUploadHandler(),
  async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const optimizedImage = await resizeImage(req.file.buffer);

      const newEvaluation = new Evaluation({
        contentType: req.file.mimetype,
        image: optimizedImage.buffer,
        evaluation: {
          brand: req.body.merkki || "Ei tiedossa",
          model: req.body.malli || "Ei tiedossa",
          color: req.body.vari || "Ei tiedossa",
          dimensions: {
            length: req.body.mitat?.pituus || 0,
            width: req.body.mitat?.leveys || 0,
            height: req.body.mitat?.korkeus || 0,
          },
          materials:
            req.body.materiaalit?.map((mat: string) => ({
              material: mat,
            })) || [],
          condition: req.body.kunto || "Ei tiedossa",
        },
      });

      const savedEvaluation = await newEvaluation.save();
      return res.json(savedEvaluation);
    } catch (error) {
      console.error("Server error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      return res.status(500).json({ error: errorMessage });
    }
  }
);
