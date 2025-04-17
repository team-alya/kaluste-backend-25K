// Kaikki alla oleva koodi ei käytössä, koska Perplexityn APIn kutsu kestää liian kauan
// Käytetään OpenAI:n mallia hinta-analyysiin.

import {
  NewFurnitureDetails,
  PriceEstimation,
  priceEstimationSchema,
  SerpApiResult,
} from "@/types/schemas";
import { openai } from "@ai-sdk/openai";
//import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject } from "ai";
import dedent from "dedent";
import dotenv from "dotenv";
dotenv.config();
/*
const perplexity = createOpenAICompatible({
  name: "perplexity",
  headers: {
    Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
  },
  baseURL: "https://api.perplexity.ai/",
});

async function perplexityPrizeAnalyse(
  furnitureDetails: NewFurnitureDetails,
  serpApiResult: SerpApiResult
) {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("fi-FI", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const result = await generateText({
    model: perplexity("sonar"),
    prompt: `
      Analysoi tämän huonekalun hinta käytettyjen tavaroiden markkinoilla Suomessa.
      Analyysi tehty: ${formattedDate}

      TUOTETIEDOT:
      - Merkki: ${serpApiResult.merkki}
      - Malli: ${serpApiResult.malli}
      - Väri: ${furnitureDetails.vari}
      - Mitat: ${furnitureDetails.mitat.pituus}x${furnitureDetails.mitat.leveys}x${furnitureDetails.mitat.korkeus} cm
      - Materiaalit: ${furnitureDetails.materiaalit.join(", ")}
      - Kunto: ${furnitureDetails.kunto}

      Anna hinta-arvio huomioiden:
      1. Tuotteen ominaisuudet
      2. Nykyiset markkinahinnat Suomessa
      3. Tämänhetkinen markkinatilanne (${formattedDate})
    `,
    temperature: 0,
  });

  return result.text;
}

// Jos brändi ei tiedossa
async function perplexityPrizeAnalyseUnknownBrand(
  furnitureDetails: NewFurnitureDetails
) {
  const result = await generateText({
    model: perplexity("sonar"),
    prompt: `
      Arvioi huonekalun markkinahinta käytettyjen tavaroiden markkinoilla Suomessa perustuen seuraaviin ominaisuuksiin:
      
      - Väri: ${furnitureDetails.vari} (Esim. neutraalit värit kuten musta, harmaa ja valkoinen ovat usein kysytympiä.)
      - Mitat: ${furnitureDetails.mitat.pituus}x${furnitureDetails.mitat.leveys}x${furnitureDetails.mitat.korkeus} cm (Suuremmat huonekalut voivat olla vaikeampia myydä.)
      - Materiaalit: ${furnitureDetails.materiaalit.join(", ")} (Massiivipuu ja metalli ovat arvokkaampia kuin lastulevy.)
      - Kunto: ${furnitureDetails.kunto} (Uudenveroinen ja hyväkuntoinen huonekalu on arvokkaampi.)
      
      Ota huomioon seuraavat arviointikriteerit:
      1. Väri:
         - Neutraalit värit (musta, harmaa, valkoinen) ovat kysytympiä.
         - Kirkkaat tai epätavalliset värit voivat rajoittaa ostajakuntaa.
      2. Mitat:
         - Suuret huonekalut voivat olla vaikeampia myydä kuljetushaasteiden vuoksi.
         - Kompaktit ja modulaariset mallit ovat kysytympiä pienissä asunnoissa.
      3. Materiaalit:
         - Massiivipuu ja metalli ovat arvostetumpia kuin lastulevy ja muovi.
         - Kestävä ja helppohoitoinen materiaali lisää arvoa.
      4. Kunto:
         - Uudenveroinen tuote voi saavuttaa lähes uuden hinnan.
         - Pienet viat voivat vähentää arvoa 10–30 %.
         - Kulunut tai rikkinäinen huonekalu voi olla vaikea myydä ilman kunnostusta.
      
      Arvioi tuotteen hinta perustuen näihin tekijöihin ja anna perusteltu arvio euroina.
    `,
    temperature: 0,
  });

  return result.text;
}
*/
async function generatePriceObject(
  furnitureDetails: NewFurnitureDetails,
  serpApiResult: SerpApiResult
) {
  const result = await generateObject({
    model: openai("gpt-4o-2024-11-20"),
    schema: priceEstimationSchema,
    temperature: 0.5,
    system: dedent`
    Olet huonekalujen hinta-arvioija Suomen markkinoilla.
    Käytä annettua Perplexityn tuottamaa analyysiä hinta-arvion pohjana, jos se on järkevä.
    Jos annettu analyysi ei ole käyttökelpoinen, tee oma arvio tuotetietojen perusteella.
    Anna aina konkreettiset hinnat ja perustelut tuotteen ominaisuuksien pohjalta.
    `,
    prompt: dedent`
    TUOTETIEDOT:
    - Merkki: ${serpApiResult.merkki}
    - Malli: ${serpApiResult.malli}
    - Väri: ${furnitureDetails.vari}
    - Mitat: ${furnitureDetails.mitat.pituus}x${furnitureDetails.mitat.leveys}x${furnitureDetails.mitat.korkeus} cm
    - Materiaalit: ${furnitureDetails.materiaalit.join(", ")}
    - Kunto: ${furnitureDetails.kunto}

    Käytä Perplexityn analyysiä markkinahinnoista hinta-arvion apuna, jos se on käyttökelponen.
    Jos analyysi ei ole käyttökelpoinen, tee oma arvio tuotetietojen perusteella.
    Ole kriittinen ja perustele hinta-arviosi huolellisesti.

    Anna nyt analyysisi perustuen tuotetietoihin. Arvioi tuotteen hinta käytettyjen tavaroiden markkinoilla Suomessa. Olet itsenäinen hina-arvioija ja vastaat asiakkaalle myyjän näkökulmasta.
    Älä mainitse vastauksessa Perplexity-analyysin lähteenäsi.
    `,
  });

  return result.object;
}

export const analyzePrice = async (
  furnitureDetails: NewFurnitureDetails,
  serpApiResult: SerpApiResult
): Promise<PriceEstimation> => {
  try {
    /*const perplexityAnalysis =
      serpApiResult.merkki === "Ei tiedossa"
        ? await perplexityPrizeAnalyseUnknownBrand(furnitureDetails)
        : await perplexityPrizeAnalyse(furnitureDetails, serpApiResult);
    console.log(perplexityAnalysis);
    */
    const result = await generatePriceObject(furnitureDetails, serpApiResult);

    return result;
  } catch (error) {
    console.error("Error in price analysis:", error);
    throw error;
  }
};
