import { BaseResponse, getJson } from "serpapi";

const serpApi_Key = process.env.SERPAPI_API_KEY;

//
interface VisualMatch {
  position: string;
  title: string;
}

// Define the structure of the response you expect from the API
export const serpapi = async (id: string): Promise<BaseResponse> => {
  const result = await getJson(
    {
      engine: "google_lens",
      url: `https://kalustearvio-25k-backend-kalustearvio-25k.2.rahtiapp.fi/api/image/serpapi/${id}`, //https://kalustearvio.fi/api/image/i432dw3
      api_key: serpApi_Key,
      country: "FI",
    },
    (json) => {
      return json["visual_matches"];
    }
  );

  const trimmedresult: VisualMatch[] =
  result.visual_matches
    .map((match: VisualMatch) => ({
      position: match.position,
      title: match.title,
    }))
    .slice(0, 20);

  return trimmedresult;
};
