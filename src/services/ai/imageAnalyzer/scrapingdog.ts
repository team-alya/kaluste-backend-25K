import axios from "axios";

const apikey = process.env.SCRAPINGDOG_API_KEY;
const url = "https://api.scrapingdog.com/google_lens/";

interface VisualMatch {
  position: string;
  title: string;
}

export const scrapingDog = async (id: string) => {
  const params = {
    api_key: apikey,
    url: `https://kalustearvio-25k-backend-kalustearvio-25k.2.rahtiapp.fi/api/image/${id}`,
    country: "fi",
  };

  const result = await axios
    .get(url, { params: params })
    .then(function (response) {
      if (response.status === 200) {
        return response.data.lens_results;
      } else {
        console.log("Request failed with status code: " + response.status);
      }
    })
    .catch(function (error) {
      console.error("Error making the request: " + error.message);
    });

  const trimmedresult: VisualMatch[] = result
    .map((match: VisualMatch) => ({
      position: match.position,
      title: match.title,
    }))
    .slice(0, 20);

  return trimmedresult;
};
