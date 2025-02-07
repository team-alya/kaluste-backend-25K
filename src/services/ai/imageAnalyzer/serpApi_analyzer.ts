import { BaseResponse, getJson } from "serpapi"

const serpApi_Key = process.env.SERPAPI_API_KEY;

export const serpapi = async (): Promise<BaseResponse> => {
    const result = await getJson({
        engine: "google_lens",
        url: "https://i.imgur.com/VTfJWrZ.jpeg", //https://kalustearvio.fi/api/image/i432dw3
        api_key: serpApi_Key,
        country: "fi"
    }, (json) => {
        return json["visual_matches"];
    });
    return result;
}