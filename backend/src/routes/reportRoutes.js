import { Router } from "express";
import { exportCSV } from "../controllers/reportController.js";

const router = Router();

router.get("/export", exportCSV);

export default router;
