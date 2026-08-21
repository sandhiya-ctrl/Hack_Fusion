import { Router } from "express";
import {
  runValidation,
  getResults,
  getRecordDetail,
  getLatestBatch,
  updateReview,
} from "../controllers/validationController.js";

const router = Router();

router.post("/run", runValidation);
router.get("/results", getResults);
router.get("/results/:recordId", getRecordDetail);
router.patch("/results/:recordId/review", updateReview);
router.get("/latest-batch", getLatestBatch);

export default router;
