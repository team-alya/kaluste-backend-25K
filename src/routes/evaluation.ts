import express, { NextFunction, Request, Response } from "express";
import { imageUploadHandler } from "../middleware/middleware";
import { resizeImage } from "../utils/resizeImage";
import { CustomError } from "@/types/customError";
import Evaluation from "@/middleware/models/evaluation";
import Image from "@/middleware/models/image";
import ExpertSelectedBrand from "@/middleware/models/expertSelectedBrand";
import { expensiveBrands } from "../services/ai/prompts/expensiveBrands";
import path from "path";
import fs from "fs";
import { verifyToken } from "@/middleware/auth";
import { requiredRole } from "@/middleware/roleChecker";
import multer from "multer";
const upload = multer();
const router = express.Router();

router.get("/all", verifyToken,
  requiredRole("customer", "expert", "admin"), async (_req, res: Response, next: NextFunction) => {
    try {
      console.log("Searching for evaluations...")
      const evaluations = await Evaluation.find();

      console.log("Evaluations found, sending results...");
      return res.json(evaluations);
    } catch (error) {
      console.error("Error fetching image:", error);
      return next(new CustomError("Error fetching evaluations", 500));
    }
  });

router.get("/:id", verifyToken,
  requiredRole("customer", "expert", "admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("GET evaluation with id...")
      const evaluation = await Evaluation.findById(req.params.id);

      if (!evaluation) {
        throw new CustomError("Evaluation not found", 404);
      }

      console.log("Evaluation found, returning found evaluation")
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
          materials: req.body.materiaalit || [],
          condition: req.body.kunto || "Ei tiedossa",
        },
        user: req.user?.username,
      });

      const savedEvaluation = await newEvaluation.save();
      console.log("Evaluation saved successfully, returning saved evaluation")
      return res.json(savedEvaluation);
    } catch (error) {
      console.error("Error saving evaluation", error);
      return next(error);
    }
  }
);

// tietokannan nollaus, oletuksena vain lokaalisti toimisi

router.post("/reset", verifyToken,
  requiredRole("customer", "expert", "admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {

      await Evaluation.deleteMany({});
      await Image.deleteMany({});

      const imagePaths = [
        path.join(process.cwd(), "./images/kuva1.jpg"),
        path.join(process.cwd(), "./images/kuva2.jpg"),
        path.join(process.cwd(), "./images/kuva3.jpg"),
        path.join(process.cwd(), "./images/kuva4.jpg"),
        path.join(process.cwd(), "./images/kuva5.jpg"),
      ];

      const newEvaluationsData = [
        {
          merkki: "Pohjanmaan Kaluste",
          malli: "Ei tiedossa",
          vari: "Ruskea",
          mitat: { pituus: 200, leveys: 90, korkeus: 90 },
          materiaalit: ["nahka"],
          kunto: "Huono",
        },
        {
          merkki: "Pohjanmaan Fantasy",
          malli: "Sohva",
          vari: "Beige",
          mitat: { pituus: 180, leveys: 90, korkeus: 85 },
          materiaalit: ["kangas", "puu"],
          kunto: "Hyvä",
        },
        {
          merkki: "Asko",
          malli: "Ei tiedossa",
          vari: "Vihreä",
          mitat: { pituus: 80, leveys: 70, korkeus: 100 },
          materiaalit: ["puu", "kangas"],
          kunto: "Kohtalainen",
        },
        {
          merkki: "Ei tiedossa",
          malli: "Kustavilainen",
          vari: "Vaalea puu",
          mitat: { pituus: 40, leveys: 40, korkeus: 90 },
          materiaalit: ["puu", "kangas"],
          kunto: "Hyvä",
        },
        {
          merkki: "Laitalan Kaluste",
          malli: "Talonpoikaisrokokoo",
          vari: "Vaalea, koristeellinen",
          mitat: { pituus: 45, leveys: 45, korkeus: 90 },
          materiaalit: ["puu", "kangas"],
          kunto: "Hyvä",
        }
      ];

      const savedEvaluations = [];

      for (let i = 0; i < newEvaluationsData.length; i++) {
        const imagePath = imagePaths[i];
        const imageBuffer = fs.readFileSync(imagePath);

        const optimizedImage = await resizeImage(imageBuffer);

        const imageForEvaluation = new Image({
          contentType: "image/jpg",
          image: optimizedImage.buffer,
        });

        const savedImage = await imageForEvaluation.save();

        const newEvaluation = new Evaluation({
          imageId: savedImage.id,
          evaluation: {
            brand: newEvaluationsData[i].merkki || "Ei tiedossa",
            model: newEvaluationsData[i].malli || "Ei tiedossa",
            color: newEvaluationsData[i].vari || "Ei tiedossa",
            dimensions: {
              length: newEvaluationsData[i].mitat?.pituus || 0,
              width: newEvaluationsData[i].mitat?.leveys || 0,
              height: newEvaluationsData[i].mitat?.korkeus || 0,
            },
            materials: newEvaluationsData[i].materiaalit || [],
            condition: newEvaluationsData[i].kunto || "Ei tiedossa",
          },
          user: req.user?.username,
        });

        const savedEvaluation = await newEvaluation.save();
        savedEvaluations.push(savedEvaluation);
      }

      return res.status(201).json({
        message: "Database reset complete with new evaluations",
        evaluations: savedEvaluations,
      });

    } catch (error) {
      console.error("Error resetting database:", error);
      return next(error);
    }
  });



router.post("/check", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merkki: brand, malli: model } = req.body;

    if (!brand || !model) {
      throw new CustomError("Brand and model are required", 400);
    }

    const query: any = {};
    if (brand) query.brand = brand;
    if (model) query.model = model;

    console.log("Checking if brand or model are wanted...")
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
      console.log("Evaluation saved successfully")
      return res.json(savedEvaluation);
    } catch (error) {
      console.error("Error saving evaluation", error);
      return next(error);

    }
  }
);


// Poistoreitti
router.delete("/:id", verifyToken,
  requiredRole("admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Trying to find evaluation by id...")
      const evaluation = await Evaluation.findById(req.params.id);
      if (!evaluation) {
        throw new CustomError("Evaluation not found", 404);
      }
      console.log("Evaluation found, deleting image and evaluation...")
      await Image.findByIdAndDelete(evaluation.imageId);

      await Evaluation.findByIdAndDelete(req.params.id);

      console.log("Evaluation and related image deleted successfully")
      return res
        .status(200)
        .json({ message: "Evaluation and related image deleted successfully" });
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      return next(error);
    }
  });

// Evaluationin päivitysreitti
router.put("/:id", upload.none(), verifyToken,
  requiredRole("expert", "admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Trying to find evaluation by id...")
      const evaluation = await Evaluation.findById(req.params.id)
      if (!evaluation) {
        throw new CustomError("Evaluation not found", 404);
      }

      console.log("Evaluation found, starting update...")
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
        console.log("Update successful, returning updated evaluation")
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
