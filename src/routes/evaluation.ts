//import Evaluation from "@/middleware/models/evaluation";
import express, { NextFunction, Request, Response } from "express";
import { imageUploadHandler } from "../middleware/middleware";
import { resizeImage } from "../utils/resizeImage";
import { CustomError } from "@/types/customError";
import Evaluation from "@/middleware/models/evaluation";
import Image from "@/middleware/models/image";
import { verifyToken } from "@/middleware/auth";
import { requiredRole } from "@/middleware/roleChecker";

import multer from "multer";
const upload = multer();

const router = express.Router();
/*
router.get("/all", async (_req, res: Response, next: NextFunction) => {
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
    return next(new CustomError("Error fetching evaluations", 500));
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      throw new CustomError("Evaluation not found", 404);
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
    return next(error);
  }
});

router.post(
  "/save",
  imageUploadHandler(),
  async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.file.buffer) {
        throw new CustomError("No image file provided", 400);
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
*/
// Uusi mahdollinen evaluation tyyppi

router.get("/all", async (_req, res: Response, next: NextFunction) => {
  try {
    const evaluations = await Evaluation.find();

    return res.json(evaluations);
  } catch (error) {

    return next(new CustomError("Error fetching evaluations", 500));
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      throw new CustomError("Evaluation not found", 404);
    }

    return res.json(evaluation);
  } catch (error) {
    console.error("Error fetching image:", error);
    return next(error);
  }
});

router.post(
  "/save",
  verifyToken,
  requiredRole("customer", "admin"),
  imageUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file || !req.file.buffer) {
        throw new CustomError("No image file provided", 400);
      }

      if (!req.user) {
        throw new CustomError("User required", 400);
      }

      const optimizedImage = await resizeImage(req.file.buffer);

      const imageForEvaluation = new Image({
        contentType: req.file.mimetype,
        image: optimizedImage.buffer,
      });

      const savedImage = await imageForEvaluation.save();
      console.log("saved image id: " + savedImage.id);

      const newEvaluation = new Evaluation({
        imageId: savedImage.id,
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
            req.body.materiaalit || [],
          condition: req.body.kunto || "Ei tiedossa",
          user: req.user
        },
      });

      const savedEvaluation = await newEvaluation.save();
      return res.json(savedEvaluation);
    } catch (error) {
      console.error("Error saving evaluation", error);
      return next(error);
    }
  }
);

// Poistoreitti
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      throw new CustomError("Evaluation not found", 404);
    }

    await Image.findByIdAndDelete(evaluation.imageId);

    await Evaluation.findByIdAndDelete(req.params.id);

    return res
      .status(200)
      .json({ message: "Evaluation and related image deleted successfully" });
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    return next(error);
  }
});

// Evaluationin päivitysreitti
router.put("/:id", upload.none(), async (req: Request, res: Response, next: NextFunction) => {
  try{
    const evaluation = await Evaluation.findById(req.params.id)
    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }
    
    try {
      console.log("req.body: ", req.body);
      const newEvaluation = {
        brand: req.body.merkki || evaluation?.evaluation?.brand,
        model: req.body.malli || evaluation?.evaluation?.model,
        color: req.body.vari || evaluation?.evaluation?.color,
        dimensions: {
          length: req.body.mitat?.pituus || evaluation?.evaluation?.dimensions?.length,
          width: req.body.mitat?.leveys || evaluation?.evaluation?.dimensions?.width,
          height: req.body.mitat?.korkeus || evaluation?.evaluation?.dimensions?.height,
        },
        materials:
          req.body.materiaalit || evaluation?.evaluation?.materials,
        condition: req.body.kunto || evaluation?.evaluation?.condition,
      }

      const updatedEvaluation = await Evaluation.findByIdAndUpdate(req.params.id, { evaluation: newEvaluation }, { new: true });
      return res.json(updatedEvaluation);
    } catch (error) {
      return next(error)
    }
  } catch (error) {
    console.error("Error updating evaluation:", error);
    return next(error);
  }
})

export default router;
