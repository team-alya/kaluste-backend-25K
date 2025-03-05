import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { BaseResponse } from "serpapi";
import { z } from "zod";
import { imgAnalyzeSystemMsg } from "./prompts/system";
import { analyzeImagePromptGPT4o } from "./prompts/prompts";

interface AnalyysiTulos {
  malli: string;
  merkki: string;
  varmuus: number;
}

export const serpApiResultSchema = z.object({
  merkki: z
    .string()
    .describe(
      "Huonekalun valmistajan nimi tai tyylisuunta. Tunnettujen valmistajien kohdalla palauta valmistajan nimi (esim. Isku, Martela, Artek, Asko, IKEA). Jos et pysty tunnistamaan merkkiä tai tyyliä varmuudella, palauta 'Ei tiedossa'."
    ),
  malli: z
    .string()
    .describe(
      "Huonekalun mallinimi, sarja tai tyylillinen kuvaus. Voi olla tarkka mallisarja (esim. 'Kilta', 'Mondo'). Jos mallia ei voi tunnistaa varmuudella, palauta 'Ei tiedossa'. Älä arvaa."
    ),
  varmuus: z
    .number()
    .describe(
      "Anna myös varmuusasteikko 0-1 siitä, kuinka varma tiedosta olet."
    ),
});

export const chatgptForBrandAndModel = async (
  data: BaseResponse
): Promise<AnalyysiTulos> => {
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
  } as AnalyysiTulos;
};

export const kuntoOptions = [
  "Uusi",
  "Erinomainen",
  "Hyvä",
  "Kohtalainen",
  "Huono",
  "Ei tiedossa",
] as const;

export const detailSchema = z
  .object({
    vari: z.string(),
    mitat: z
      .object({
        pituus: z.number(),
        leveys: z.number(),
        korkeus: z.number(),
      })
      .describe("Mitat senttimetreinä. Anna paras arviosi, jos et ole varma."),
    materiaalit: z.array(z.string()),
    kunto: z
      .enum(kuntoOptions)
      .describe(
        "Huonekalun kuntoarvio. Valitse paras arvio listalta. Isolla alkukirjaimella."
      ),
  })
  .describe(
    "Jos et ole varma jostain kentästä, palauta 'Ei tiedossa'. Älä arvaa."
  );

export type details = z.infer<typeof detailSchema>;

export const chatgptRestOfAnalysis = async (
  imageBuffer: Buffer
): Promise<details> => {
  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: detailSchema,
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
