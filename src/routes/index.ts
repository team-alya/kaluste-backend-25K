import { Router } from "express";
import photoRouter from "./photo";
import imageRouter from "./image";
import priceRouter from "./price";
import loginRouter from "./login";
import evaluationRouter from "./evaluation";
import placesRouter from "./location";
import expertSelectedBrand from "./expertSelectedBrand";
import adminRoutes from "./admin";

const router = Router();
// ping route for health check
router.get("/ping", (_req, res) => {
  res.send("pong!");
});

// Define routes

router.use("/photo", photoRouter);
router.use("/image", imageRouter);
router.use("/price", priceRouter);
router.use("/login", loginRouter);
router.use("/evaluation", evaluationRouter);
router.use("/location", placesRouter);
router.use("/expertSelectedBrand", expertSelectedBrand);
router.use("/admin", adminRoutes);

export default router;
