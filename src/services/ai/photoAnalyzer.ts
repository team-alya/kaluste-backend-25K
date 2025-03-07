import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { generateObject } from "ai";

type PhotoAnalysisResult = {
  main_object_detected: string | null;
  main_object_visibility: number;
  photo_quality_score: number;
  lighting: number;
  sharpness: number;
  message: string;
};

const photoQualitySchema = z.object({
  main_object_detected: z
    .string()
    .nullable()
    .describe(
      "Tunnistettu pääkohde ilman häiritseviä elementtejä. Jos et pysty tunnistamaan pääkohde varmuudella tai sitä ei näy kokonaisuudessaan, palauta 'Ei tunnistettu'."
    ),
  photo_quality_score: z
    .number()
    .min(0)
    .max(100)
    .describe("Kuvan laadun arvio 0-100"),
  main_object_visibility: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Arvio (0-100) siitä, kuinka suuri osa pääkohteesta on näkyvissä kuvassa."
    ),
  lighting: z
    .number()
    .min(0)
    .max(100)
    .describe("Kuvan valaistuksen arvio 0-100"),
  sharpness: z
    .number()
    .min(0)
    .max(100)
    .describe("Kuvan tarkkuuden arvio 0-100"),
  message: z
    .string()
    .describe("Dynaaminen viesti perustuen analyysin tuloksiin."),
});

export class GPT4Analyzer {
  name = "GPT-4o";

  async analyzePhotoQuality(photo: Buffer): Promise<PhotoAnalysisResult> {
    try {
      const result = await generateObject({
        model: openai("gpt-4o"),
        schema: photoQualitySchema,
        // output: "object",
        system:
          "Olet asiantuntija valokuvien arvioinnissa, jossa ensisijaisena tavoitteena on, että kuvassa on vain yksi esine tai huonekalu, jotta sen laatu ja kunto voidaan analysoida tarkemmin.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
                Analysoi tämä kuva ja arvioi seuraavat asiat:
                1. Näkyykö kuvassa selkeästi yksi pääkohde ilman häiritseviä elementtejä?
                2. Onko kuvassa pääkohdesta kokonaisuudessaan yli 90%? Ole erityisesti tarkka, että kuva on otettu hyvästä kulmasta, koska jatkoanalyysissä täytyy olla mahdollisuus tunnistaa brändi.
                3. Onko valaistus riittävä?
                4. Onko kuva tarkka? `,
              },
              {
                type: "image",
                image: photo,
              },
            ],
          },
        ],
      });

      let message = "";

      if (
        !result.object.main_object_detected ||
        result.object.main_object_detected === "Ei tunnistettu"
      ) {
        message =
          "Kuvassa on useita kohteita, mikä voi vaikeuttaa pääkohteen erottamista. Haluaisitko kokeilla eri kuvakulmaa? ";
      } else if (result.object.main_object_visibility < 90) {
        message =
          "Pääkohde ei ole täysin näkyvissä kuvassa. Yritä ottaa kuva, jossa kohde on selkeämmin esillä. ";
      } else if (result.object.photo_quality_score < 50) {
        message =
          "Suositelemme ottamaan kuvan uudestaan, tarkistaisitko valaistuksen ja tarkkuuden? ";
      } else {
        if (result.object.lighting < 50) {
          message += "Valaistus saattaa olla hieman heikko. ";
        }
        if (result.object.sharpness < 50) {
          message +=
            "Kuva vaikuttaa epätarkalta. Ehkä uudelleentarkennus voisi auttaa?";
        }
        if (!message) {
          message = "Kuva vaikuttaa hyvälaatuiselta. Voimme jatkaa analyysiä.";
        }
      }

      return { ...result.object, message } as PhotoAnalysisResult;
      //return result.object as PhotoAnalysisResult;
    } catch (error) {
      console.error("Error analyzing photo quality:", error);
      throw error;
    }
  }
}
