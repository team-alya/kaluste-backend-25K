import express, { NextFunction, Request, Response } from "express";
import { imageUploadHandler } from "../middleware/middleware";
import { resizeImage } from "../utils/resizeImage";
import { BaseResponse } from "serpapi";
import { serpapi } from "@/services/ai/imageAnalyzer/serpApi_analyzer";
import tempImage from "@/middleware/models/tempImage";
import {
  chatgptForBrandAndModel,

} from "@/services/ai/dataAnalyzer/gpt4-Analyzer";
import { CustomError } from "@/types/customError";

import { chatgptRestOfAnalysis } from "@/services/ai/imageAnalyzer/gpt4-analyzer";
import { scrapingDog } from "@/services/ai/imageAnalyzer/scrapingdog";


//import fs from "fs";
import Image from "@/middleware/models/image";

const router = express.Router();
/*
router.post(
  "/",
  imageUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file || !req.file.buffer) {
        throw new CustomError("No image file provided", 400);
      }

      const optimizedImage = await resizeImage(req.file.buffer);

      try {
        let furnitureData = await runImageAnalysisPipeline(
          optimizedImage.buffer
        );

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
            throw new CustomError("Final image analysis failed", 500);
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
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
  }
);
*/
router.post(
  "/",
  imageUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    let savedImageId: string = "";
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
        userObject = req.body.user;
      }

      try {
        console.log("trying to save image to db");

        const imageForEvaluation = new tempImage({
          contentType: req.file.mimetype,
          image: optimizedImage.buffer,
        });

        const savedImage = await imageForEvaluation.save();
        savedImageId = savedImage.id;
        console.log("saved image successfully, id: " + savedImageId);

        try {
          console.log("pass the id to serpapi");
          const serpApiResponse: BaseResponse = await serpapi(savedImageId);

          console.log("pass the serpapi response to chatgpt");
          const [chatgptResponse, restGptAnalysis] = await Promise.all([
            chatgptForBrandAndModel(serpApiResponse),
            chatgptRestOfAnalysis(optimizedImage.buffer),
          ]);

          const evaluation = {
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
              user: userObject,
            },
          };
          return res.json(evaluation);
        } catch (error) {
          console.error("Pipeline error:", error);
          return next(error);
        }
      } catch (error) {
        console.error("Image handling failed: ", error);
        return next(error);
      }
    } catch (error) {
      console.error("Server error:", error);
      return next(error);
    } finally {
      if (savedImageId !== "") {
        try {
          console.log("delete the image from db");
          await tempImage.findByIdAndDelete(savedImageId);
          console.log("Image deleted successfully.");
        } catch (deleteError) {
          console.error("Error deleting image:", deleteError);
          next(deleteError);
        }
      }
    }
  }
);

// Find evaluation image by id
router.get("/serpapi/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const image = await tempImage.findById(req.params.id);
    if (!image) {
      throw new CustomError("Image not found", 404);
    }

    res.setHeader("Content-Type", image.contentType);
    return res.send(image.image);
  } catch (error) {
    console.error("Error fetching image:", error);
    return next(error);
  }
});

// Find evaluation image by id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      throw new CustomError("Image not found", 404);
    }

    res.setHeader("Content-Type", image.contentType);
    return res.send(image.image);
  } catch (error) {
    console.error("Error fetching image:", error);
    return next(error);
  }
}
);

router.post(
  "/scraping",
  imageUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    let savedImageId: string = "";
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const optimizedImage = await resizeImage(req.file.buffer);
      try {
        console.log("trying to save image to db");

        const imageForEvaluation = new tempImage({
          contentType: req.file.mimetype,
          image: optimizedImage.buffer,
        });

        const savedImage = await imageForEvaluation.save();
        savedImageId = savedImage.id;
        console.log("saved image successfully, id: " + savedImageId);

        try {
          const scrapingApiResponse = await scrapingDog(savedImageId);
          console.log(scrapingApiResponse);

          const chatgptResponse =
            await chatgptForBrandAndModel(scrapingApiResponse);

          const evaluation = {
            evaluation: {
              brand: chatgptResponse.merkki || "Ei tiedossa",
              model: chatgptResponse.malli || "Ei tiedossa",
            },
          };

          return res.json(evaluation);
        } catch (error) {
          console.error("Pipeline error:", error);
          return next(error);
        }
      } catch (error) {
        console.error("Image handling failed: ", error);
        return next(error);
      }
    } catch (error) {
      console.error("Server error:", error);
      return next(error);
    } finally {
      if (savedImageId !== "") {
        try {
          console.log("delete the image from db");
          await tempImage.findByIdAndDelete(savedImageId);
          console.log("Image deleted successfully.");
        } catch (deleteError) {
          console.error("Error deleting image:", deleteError);
          next(deleteError);
        }
      }
    }
  }
);

/*
);

router.post(
  "/saveimage",
  imageUploadHandler(),
  async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const optimizedImage = await resizeImage(req.file.buffer);

      try {
        console.log("trying to save img");

        const imageForEvaluation = new SaveImage({
          contentType: req.file.mimetype,
          image: optimizedImage.buffer,
        });

        const savedImage = await imageForEvaluation.save();
        console.log("saved image id: " + savedImage.id);

        const newEvaluation = new Evatest({
          imageId: savedImage.id,
          evaluation: {
            brand: "Ei tiedossa",
            model: "Ei tiedossa",
            color: "Ei tiedossa",
            dimensions: {
              length: 0,
              width: 0,
              height: 0,
            },
            materials: [],
            condition: "Ei tiedossa",
            user: userObject,
          },
        });

        const savedEvaluation = await newEvaluation.save();

        //await Image.findByIdAndDelete(savedImage.id);
        return res.json(savedEvaluation);
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

router.post(
  "/search",
  imageUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    let savedImageId: string = "";
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const optimizedImage = await resizeImage(req.file.buffer);
      try {
        console.log("trying to save image to db");

        const imageForEvaluation = new Image({
          contentType: req.file.mimetype,
          image: optimizedImage.buffer,
        });

        const savedImage = await imageForEvaluation.save();
        savedImageId = savedImage.id;
        console.log("saved image successfully, id: " + savedImageId);

        try {
          const searchApiResponse = await searchApi(savedImageId);

          const chatgptResponse =
            await chatgptForBrandAndModel(searchApiResponse);

          const evaluation = {
            evaluation: {
              brand: chatgptResponse.merkki || "Ei tiedossa",
              model: chatgptResponse.malli || "Ei tiedossa",
            },
          };

          return res.json(evaluation);
        } catch (error) {
          console.error("Pipeline error:", error);
          return next(error);
        }
      } catch (error) {
        console.error("Image handling failed: ", error);
        return next(error);
      }
    } catch (error) {
      console.error("Server error:", error);
      return next(error);
    } finally {
      if (savedImageId !== "") {
        try {
          console.log("delete the image from db");
          await Image.findByIdAndDelete(savedImageId);
          console.log("Image deleted successfully.");
        } catch (deleteError) {
          console.error("Error deleting image:", deleteError);
          next(deleteError);
        }
      }
    }
  }
);

router.post(
  "/scraping",
  imageUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    let savedImageId: string = "";
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const optimizedImage = await resizeImage(req.file.buffer);
      try {
        console.log("trying to save image to db");

        const imageForEvaluation = new Image({
          contentType: req.file.mimetype,
          image: optimizedImage.buffer,
        });

        const savedImage = await imageForEvaluation.save();
        savedImageId = savedImage.id;
        console.log("saved image successfully, id: " + savedImageId);

        try {
          const scrapingApiResponse = await scrapingDog(savedImageId);
          console.log(scrapingApiResponse);

          const chatgptResponse =
            await chatgptForBrandAndModel(scrapingApiResponse);

          const evaluation = {
            evaluation: {
              brand: chatgptResponse.merkki || "Ei tiedossa",
              model: chatgptResponse.malli || "Ei tiedossa",
            },
          };

          return res.json(evaluation);
        } catch (error) {
          console.error("Pipeline error:", error);
          return next(error);
        }
      } catch (error) {
        console.error("Image handling failed: ", error);
        return next(error);
      }
    } catch (error) {
      console.error("Server error:", error);
      return next(error);
    } finally {
      if (savedImageId !== "") {
        try {
          console.log("delete the image from db");
          await Image.findByIdAndDelete(savedImageId);
          console.log("Image deleted successfully.");
        } catch (deleteError) {
          console.error("Error deleting image:", deleteError);
          next(deleteError);
        }
      }
    }
  }
);

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
