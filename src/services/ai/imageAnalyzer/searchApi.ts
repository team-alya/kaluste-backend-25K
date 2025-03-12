import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const url = "https://www.searchapi.io/api/v1/search";
const apiKey = process.env.SEARCHAPI_API_KEY;

interface VisualMatch {
  position: string;
  title: string;
}

export const searchApi = async (id: string) => {
  const params = {
    engine: "google_lens",
    search_type: "all",
    url: `https://kalustearvio-25k-backend-kalustearvio-25k.2.rahtiapp.fi/api/image/${id}`,
    api_key: apiKey,
    country: "fi",
    hl: "fi",
  };
  const result = await axios
    .get(url, { params })
    .then((response: { data: any }) => {
      return response.data.visual_matches;
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  const trimmedresult: VisualMatch[] = result
    .map((match: VisualMatch) => ({
      position: match.position,
      title: match.title,
    }))
    .slice(0, 20);

  return trimmedresult;
};
