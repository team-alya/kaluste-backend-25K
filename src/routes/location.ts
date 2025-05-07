import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import Location from "@/middleware/models/locations";

dotenv.config();

const router = express.Router();
const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

// This is not in use, but may be useful in the future
// Function to find locations using SerpApi
const findLocations = async (coordinates: string) => {
  const url = `https://serpapi.com/search.json?engine=google_maps&q=Kierrätyskeskus&ll=@${coordinates},12z&api_key=${SERPAPI_KEY}`;

  try {
    const response = await axios.get(url);
    const results = response.data.local_results.map((place: any) => ({
      name: place.title,
      address: place.address,
      type: place.type,
      gps_coordinates: place.gps_coordinates,
    }));

    return results;
  } catch (error) {
    console.error("Error in SerpApi search:", error);
    return [];
  }
};
// POST route to handle location search
router.post("/", async (req: Request, res: Response) => {
  const { coordinates } = req.body;

  if (!coordinates) {
    return res.status(400).json({ error: "Coordinates not gived" });
  }

  try {
    const locations = await findLocations(coordinates);

    const savedLocations = [];

    for (const location of locations) {
      const existingLocation = await Location.findOne({
        name: location.name,
        "gps_coordinates.latitude": location.gps_coordinates.latitude,
        "gps_coordinates.longitude": location.gps_coordinates.longitude,
      });

      if (existingLocation) {
        console.log(`Location ${location.name} already exists in DB.`);
        savedLocations.push(existingLocation);
      } else {
        const newLocation = new Location(location);
        const saved = await newLocation.save();
        savedLocations.push(saved);
      }
    }

    return res.json({ locations: savedLocations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
