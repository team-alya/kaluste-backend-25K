import { Router } from "express";
import photoRouter from "./photo";
import imageRouter from "./image";
import priceRouter from "./price";
import loginRouter from "./login";
import registerRouter from "./register";
import evaluationRouter from "./evaluation";
import placesRouter from "./location";
import expertSelectedBrand from "./expertSelectedBrand";
import userRoutes from "./user";

const router = Router();

router.get("/ping", (_req, res) => {
  res.send("pong!");
});

router.use("/photo", photoRouter);
router.use("/image", imageRouter);
router.use("/price", priceRouter);
router.use("/register", registerRouter);
router.use("/login", loginRouter);
router.use("/evaluation", evaluationRouter);
router.use("/location", placesRouter);
router.use("/expertSelectedBrand", expertSelectedBrand);
router.use("/users", userRoutes);

export default router;
