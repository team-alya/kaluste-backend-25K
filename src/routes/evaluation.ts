//import Evaluation from "@/middleware/models/evaluation";
import express, { NextFunction, Request, Response } from "express";
import { imageUploadHandler } from "../middleware/middleware";
import { resizeImage } from "../utils/resizeImage";
import { CustomError } from "@/types/customError";
import Evaluation from "@/middleware/models/evaluation";
import Image from "@/middleware/models/image";
import ExpertSelectedBrand from "@/middleware/models/expertSelectedBrand";
import { expensiveBrands } from "../services/ai/prompts/expensiveBrands";

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

router.post("/check", async (req: Request, res: Response, next: NextFunction) => {
  try {
      const { merkki: brand, malli: model } = req.body;

      if (!brand || !model) {
          return res.status(400).json({ error: "Brand and model are required" });
        }

        const query: any = {};
        if (brand) query.brand = brand;
        if (model) query.model = model;

        const existingBrand = await ExpertSelectedBrand.findOne({
          $or: [{ brand }, { model }]
          });

      if (existingBrand) {
          return res.status(200).json({
              message: "Brändi ja/tai malli tarvitaan varastoon.",
              required: true,
              reason: "brand_in_stock",
          });
        } 
   
      if (expensiveBrands.includes(brand)) {
          return res.status(200).json({
              message: "Tämän huonekalun brändi on arvokas. Suosittellaan lisämään varastoon.",
              required: true,
              reason: "expensive_brand",
          });
        }
    
      return res.status(200).json({
            message: "Varastoon lisääminen ei ole tarpeen. Haluatko silti lisätä sen?",
            required: false,
            reason: "not_required",
        });

  } catch (error) {
      console.error("Error checking model", error);
      return next(error);
  }
});


router.post(
    "/save",
    imageUploadHandler(),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file || !req.file.buffer) {
                throw new CustomError("No image file provided", 400);
            }

            if (!req.body.user) {
                throw new CustomError("User required", 400);
            }

            const optimizedImage = await resizeImage(req.file.buffer);

            let userObject;
            if (typeof req.body.user === "string") {
                userObject = req.body.user
            }

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
                    user: userObject,
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

export default router;
