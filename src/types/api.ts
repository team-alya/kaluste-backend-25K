import { Request } from "express";
import { NewFurnitureDetails, SerpApiResult } from "./schemas";

// This file contains the types for the API requests and responses
export interface FurnitureDetailsRequest extends Request {
  body: {
    furnitureDetails: NewFurnitureDetails;
    serpApiResult: SerpApiResult;
  };
  file?: Express.Multer.File;
}
