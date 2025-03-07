import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { BaseResponse } from "serpapi";
import { imgAnalyzeSystemMsg } from "./prompts/system";
import { analyzeImagePromptGPT4o } from "./prompts/prompts";
import { NewFurnitureDetails, newFurnitureDetailsSchema, SerpApiResult, serpApiResultSchema } from "@/types/schemas";

export const chatgptForBrandAndModel = async (
  data: BaseResponse
): Promise<SerpApiResult> => {
  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: serpApiResultSchema,
    output: "object",
    system: "Olet datan analysoija.",
    messages: [
      {
        role: "user",
        content: `Analysoi seuraava data ja poimi sieltä huonekalun tekijä ja malli. Anna vain yksi mielestäsi oikea vaihtoehto:\n\n${JSON.stringify(data)}. Älä arvaa ja jos et ole aivan varma ja et pysty antamaan yhtä valmistajaa ja mallia, anna vastaukseksi "Ei tiedossa".`,
      },
      {
        role: "user",
        content: JSON.stringify(data),
      },
    ],
  });
  return {
    merkki: result.object.merkki,
    malli: result.object.malli,
    varmuus: result.object.varmuus,
  } as SerpApiResult;
};

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
