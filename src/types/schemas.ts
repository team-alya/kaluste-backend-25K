import { z } from "zod";

export const kuntoOptions = [
  "Uusi",
  "Erinomainen",
  "Hyvä",
  "Kohtalainen",
  "Huono",
  "Ei tiedossa",
] as const;

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

export type SerpApiResult = z.infer<typeof serpApiResultSchema>;

export const newFurnitureDetailsSchema = z
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

export type NewFurnitureDetails = z.infer<typeof newFurnitureDetailsSchema>;

export const furnitureDetailsSchema = z.object({
  merkki: z.string().describe("Huonekalun valmistaja"),
  malli: z.string().describe("Huonekalun malli"),
  vari: z.string().describe("Huonekalun väri"),
  mitat: z
    .object({
      pituus: z.number(),
      leveys: z.number(),
      korkeus: z.number(),
    })
    .describe("Huonekalun mitat senttimetreinä"),
  materiaalit: z.array(z.string()).describe("Huonekalun materiaalit"),
  kunto: z.enum(kuntoOptions).describe("Huonekalun kunto"),
})

export type FurnitureDetails = z.infer<typeof furnitureDetailsSchema>;

export const priceEstimationSchema = z.object({
  recommended_price: z
    .number()
    .min(0)
    .max(1000000)
    .describe("Suositeltu optimaalinen myyntihinta euroina"),

  price_reason: z
    .array(z.string())
    .describe(
      "Erittäin lyhyt ja ytimekäs perustelu hinta-arviolle. Älä toista perustiedoissa mainittuja asioita. Älä mainitse Perplexityä-analyysin lähteenäsi."
    ),
});

export type PriceEstimation = z.infer<typeof priceEstimationSchema>;
