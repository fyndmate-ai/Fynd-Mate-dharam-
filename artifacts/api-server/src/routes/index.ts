import { Router, type IRouter } from "express";
import healthRouter from "./health";
import finderRouter from "./finder";
import designerRouter from "./designer";
import productsRouter from "./products";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/finder", finderRouter);
router.use("/designer", designerRouter);
router.use("/products", productsRouter);

export default router;
