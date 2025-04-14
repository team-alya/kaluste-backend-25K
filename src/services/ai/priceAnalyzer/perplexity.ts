import {
  NewFurnitureDetails,
  PriceEstimation,
  priceEstimationSchema,
  SerpApiResult,
} from "@/types/schemas";
import { openai } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject, generateText } from "ai";
import dedent from "dedent";
import dotenv from "dotenv";
dotenv.config();

const perplexity = createOpenAICompatible({
  name: "perplexity",
  headers: {
    Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
  },
  baseURL: "https://api.perplexity.ai/",
});

type SimpleSerpApiResult = {
  merkki: string;
  malli: string;
};

async function perplexityPrizeAnalyse(furnitureDetails: NewFurnitureDetails, serpApiResult: SerpApiResult) {
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
async function perplexityPrizeAnalyseUnknownBrand(furnitureDetails: NewFurnitureDetails) {
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

async function generatePriceObject(
  furnitureDetails: NewFurnitureDetails,
  perplexityAnalysis: string,
  serpApiResult: SerpApiResult,
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

    <PERPLEXITY ANALYYSI>
    ${perplexityAnalysis}
    <PERPLEXITY ANALYYSI>

    Anna nyt analyysisi perustuen tuotetietoihin. Arvioi tuotteen hinta käytettyjen tavaroiden markkinoilla Suomessa. Olet itsenäinen hina-arvioija ja vastaat asiakkaalle myyjän näkökulmasta.
    Älä mainitse vastauksessa Perplexity-analyysin lähteenäsi.
    `,
  });

  return result.object;
}

export const analyzePrice = async (
  furnitureDetails: NewFurnitureDetails,
  serpApiResult: SerpApiResult,
): Promise<PriceEstimation> => {
  try {
    const perplexityAnalysis =
        serpApiResult.merkki === "Ei tiedossa"
          ? await perplexityPrizeAnalyseUnknownBrand(furnitureDetails)
          
          : await perplexityPrizeAnalyse(furnitureDetails, serpApiResult);
    
    const result = await generatePriceObject(
      furnitureDetails,
      perplexityAnalysis,
      serpApiResult
    );

    return result;
  } catch (error) {
    console.error("Error in price analysis:", error);
    throw error;
  }
};

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
              - Materiaalit: ${furnitureDetails.materiaalit.join(", ")}
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
