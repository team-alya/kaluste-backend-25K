import {
    NewFurnitureDetails,
    PriceEstimation,
    priceEstimationSchema,
    SerpApiResult,
  } from "@/types/schemas";
  import { openai } from "@ai-sdk/openai";
  import { generateObject } from "ai";
  import dedent from "dedent";
  import dotenv from "dotenv";
  dotenv.config();
  
  async function generatePriceObject(
    furnitureDetails: NewFurnitureDetails,
    serpApiResult: SerpApiResult,
    imageBuffer: Buffer
  ) {
    const isUnknownBrand = serpApiResult.merkki === "Ei tiedossa";
  
    const promptText = isUnknownBrand
      ? dedent`

        Arvioi kuvassa olevan huonekalun markkinahinta käytettyjen tavaroiden markkinoilla Suomessa perustuen seuraaviin ominaisuuksiin, koska brändi ja malli eivät ole tiedossa:

          - Väri: ${furnitureDetails.vari}
          - Mitat: ${furnitureDetails.mitat.pituus}x${furnitureDetails.mitat.leveys}x${furnitureDetails.mitat.korkeus} cm
          - Materiaalit: ${furnitureDetails.materiaalit.join(", ")}
          - Kunto: ${furnitureDetails.kunto}

        Huomioi erityisesti, että huonekalu on käytetty ja saapuu kierrätyskeskukseen, jossa sen jälleenmyynti- tai käyttökelpoisuus on arvioitava.

        Arvioi tuotteen hinta perustuen esimerkiksi seuraaviin arviointikriteereihin. Voit lisäätä muita kriteereitä, jos tarpeen:
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
  
          Anna perusteltu arvio euroina.
        `
      : dedent`

        Arvioi kuvassa olevan huonekalun markkinahinta käytettyjen tavaroiden markkinoilla Suomessa perustuen seuraaviin ominaisuuksiin:

        Huomioi erityisesti, että huonekalu on käytetty ja saapuu kierrätyskeskukseen, jossa sen jälleenmyynti- tai käyttökelpoisuus on arvioitava.
          
          - Merkki: ${serpApiResult.merkki}
          - Malli: ${serpApiResult.malli}
          - Väri: ${furnitureDetails.vari}
          - Mitat: ${furnitureDetails.mitat.pituus}x${furnitureDetails.mitat.leveys}x${furnitureDetails.mitat.korkeus} cm
          - Materiaalit: ${furnitureDetails.materiaalit.join(", ")}
          - Kunto: ${furnitureDetails.kunto}
  
          Anna perusteltu arvio euroina.
        `;
  
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: priceEstimationSchema,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: "Olet käytettyjen huonekalujen hinta-arvioija Suomen markkinoilla. Anna konkreettinen keskihinta ja ytimekäs perustelu tuotteen ominaisuuksien ja markkinatilanteen pohjalta.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText,
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
  }
  
  
  export const analyzePrice = async (
    furnitureDetails: NewFurnitureDetails,
    serpApiResult: SerpApiResult,
    imageBuffer: Buffer
  ): Promise<PriceEstimation> => {
    try {
      const result = await generatePriceObject(furnitureDetails, serpApiResult, imageBuffer);
      return result;
    } catch (error) {
      console.error("Error in price analysis:", error);
      throw error;
    }
  };
  