import { SerpApiResult, serpApiResultSchema } from "@/types/schemas";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { dataAnalyzerGPT4oSystemMsg } from "../prompts/prompts";
import dotenv from "dotenv";

dotenv.config();
// This function is used to analyze the data from the SerpApi response
export const chatgptForBrandAndModel = async (
  data: any
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
