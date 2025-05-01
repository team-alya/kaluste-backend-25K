import {
  NewFurnitureDetails,
} from "@/types/schemas";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import dedent from "dedent";
import dotenv from "dotenv";
dotenv.config();

type SimpleSerpApiResult = {
  merkki: string;
  malli: string;
};

// This function analyzes the relevance of a stock item based on its details and image
// It uses OpenAI's GPT-4 model to generate a text response that evaluates the item's potential usefulness in stock
export async function analyzeStockRelevance(
  furnitureDetails: NewFurnitureDetails, 
  serpApiResult: SimpleSerpApiResult, 
  imageBuffer: Buffer): Promise<string> {
  const result = await generateText({
    model: openai("gpt-4o"),
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: "Olet kierrätyskeskuksen asiantuntija Suomessa. Arvioi, miksi seuraava huonekalu voisi olla hyödyllinen lisäämään varastoon kuvasta ja tiedoista päätellen.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: dedent`
              Arvioi lyhyesti brändin tai mallin kaupallisesta ja käytännöllisestä näkökulmasta.
              Jos brändi tai malli ei tiedossa, arvioi sen potentiaali tuotetietojen, käytettävyyden ja kysynnän perusteella.

              Vastaa aina yhdellä lauseella, joka alkaa täsmälleen näin:
              "Tätä brändiä ja mallia ei tarvita varastossa. Mutta tekoälyn mukaan se voi silti olla hyödyllinen"
              Sen lauseen loppuun lisää ytimekäs perustelu. Huomioi kieliasu. Älä toista tuotetietoja tai käytä niitä perusteluna.
              Jos tuotteen kunto on "Kohtalainen" tai "Huono", lisää loppuun ", vaikka sen kunto on kulunut"
              
              TUOTETIEDOT:
              - Ota huomioon tavaran kuva.
              - Merkki: ${serpApiResult.merkki}
              - Malli: ${serpApiResult.malli}
              - Väri: ${furnitureDetails.vari}
              - Mitat: ${furnitureDetails.mitat.pituus}x${furnitureDetails.mitat.leveys}x${furnitureDetails.mitat.korkeus} cm
              - Materiaalit: ${furnitureDetails.materiaalit}
              - Kunto: ${furnitureDetails.kunto}

              Valitse yksi seuraavista syistä ja lisää se lauseeseen, älä arvaa:

              - koska se on tunnettu ja arvostettu brändi
              - koska sillä on kysyntää markkinoilla
              - koska sillä on kestävät rakenne ja materiaalit
              - koska se on ainutlaatuinen
              - koska se on suosittu nuorten keskuudessa
              - koska se on käytännöllinen ja monikäyttöinen

              Jos mikään syistä ei sopi vastaa "Varastoon lisääminen ei ole tarpeen, eikä tekoäly näe tavarassa potentiaalia. Haluatko silti lisätä sen?"
            `,
          },
          {
            type: "image",
            image: imageBuffer,
          },
        ],
      },
    ],
  });

  return result.text;
}
