import { SerpApiResult, serpApiResultSchema } from "@/types/schemas";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { BaseResponse } from "serpapi";

import { dataAnalyzerGPT4oSystemMsg } from "../prompts/prompts";
import dotenv from "dotenv";

dotenv.config();

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
        content: dataAnalyzerGPT4oSystemMsg,
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
