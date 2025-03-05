import Evaluation from "@/middleware/models/evaluation";
import express, { NextFunction, Request, Response } from "express";
import { imageUploadHandler } from "../middleware/middleware";
import { resizeImage } from "../utils/resizeImage";
import { CustomError } from "@/types/customError";

const router = express.Router();

export default router;

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
    async (req: Request, res: Response, next: NextFunction) => {
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
            return next(error);
        }
    }
);
