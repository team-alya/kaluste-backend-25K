import { Request } from "express";
import { NewFurnitureDetails, SerpApiResult } from "./schemas";

export interface FurnitureDetailsRequest extends Request {
  body: {
    furnitureDetails: NewFurnitureDetails;
    serpApiResult: SerpApiResult;
  };
  file?: Express.Multer.File;
}
