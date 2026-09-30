const express = require("express");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const AppError = require("../utils/appError");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const valuation_Image_FetchT = asyncHandler(async (req, res) => {
  const { batchname, subcode, Dep_Name, Eva_Mon_Year, Img_Number } = req.query;

  if (!batchname || !subcode || !Dep_Name || !Eva_Mon_Year || !Img_Number) {
    res.status(400);
    throw new AppError("Missing required parameters", 400);
  }

  const safePattern = /^[a-zA-Z0-9_-]+$/;
  const monthYearPattern = /^[a-zA-Z]{3}_\d{4}$/;
  if (
    !safePattern.test(batchname) ||
    !safePattern.test(subcode) ||
    !safePattern.test(Dep_Name) ||
    !monthYearPattern.test(Eva_Mon_Year)
  ) {
    res.status(400);
    throw new AppError("Invalid parameter format", 400);
  }

  const imgNum = parseInt(Img_Number, 10);
  if (isNaN(imgNum) || imgNum <= 0 || imgNum > 999) {
    res.status(400);
    throw new AppError("Invalid image number", 400);
  }

  const uploadsRoot = path.resolve(__dirname, "..", "uploads");
  const imagePath = path.resolve(
    uploadsRoot,
    Eva_Mon_Year,
    "ImgImp",
    Dep_Name,
    batchname,
    `${batchname}_${imgNum.toString().padStart(2, "0")}_${subcode}.jpg`
  );

  console.log("Constructed image path:", imagePath);

  if (!imagePath.startsWith(uploadsRoot + path.sep)) {
    res.status(403);
    throw new AppError("Access denied", 403);
  }

  if (!fs.existsSync(imagePath)) {
    res.status(404);
    throw new AppError("Image not found", 404);
  }

  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  res.status(200).json({ image: base64Image });
});

router.get("/", protect, valuation_Image_FetchT);

module.exports = router;
