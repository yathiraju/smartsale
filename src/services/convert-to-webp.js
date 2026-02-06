const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const inputDir = "./products";
const outputDir = "./products-webp";

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

fs.readdirSync(inputDir)
  .filter(f => f.endsWith(".png"))
  .forEach(file => {
    sharp(path.join(inputDir, file))
      .webp({ quality: 80 })
      .toFile(path.join(outputDir, file.replace(".png", ".webp")))
      .then(() => console.log("Converted:", file))
      .catch(console.error);
  });
