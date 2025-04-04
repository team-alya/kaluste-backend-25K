import {
  NewFurnitureDetails,
  newFurnitureDetailsSchema,
} from "@/types/schemas";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import dotenv from "dotenv";
import { analyzeImagePromptGPT4o } from "../prompts/prompts";
import { imgAnalyzeSystemMsg } from "../prompts/system";
dotenv.config();

export const chatgptRestOfAnalysis = async (
  imageBuffer: Buffer
): Promise<NewFurnitureDetails> => {
  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: newFurnitureDetailsSchema,
    output: "object",
    system: imgAnalyzeSystemMsg,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: analyzeImagePromptGPT4o,
          },
          {
            type: "image",
            image: imageBuffer,
          },
        ],
      },
    ],
  });
  return result.object;
};
