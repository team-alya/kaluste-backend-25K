import dotenv from "dotenv";
const axios = require("axios");

dotenv.config();

const url = "https://www.searchapi.io/api/v1/search";
const apiKey = process.env.SEARCHAPI_API_KEY;

export const searchApi = async (id: string) => {

    const params = {
        "engine": "google_lens",
        "search_type": "all",
        "url": `https://kalustearvio-25k-backend-kalustearvio-25k.2.rahtiapp.fi/api/image/${id}`,
        "api_key": apiKey
      };
    axios.get(url, { params })
        .then((response: { data: any; }) => {
            return response.data;
        })
}
