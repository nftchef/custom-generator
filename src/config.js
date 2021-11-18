"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { MODE } = require(path.join(basePath, "src/blendMode.js"));
const buildDir = path.join(basePath, "/build");
const layersDir = path.join(basePath, "..", "/StrangeHandParts");

const description =
  "This is the description of your NFT project, remember to replace this";
const baseUri = "ipfs://NewUriToReplace/testing";
const outputJPEG = false;
// if you use an empty/transparent file, set the name here.
const emptyLayerName = "NONE";

const layerConfigurations = [
  {
    growEditionSizeTo: 11,
    layersOrder: [
      { name: "Backgrounds", options: { bypassDNA: true } },
      // { name: "Eyeball" },
      { name: "Hand Type" },
      // { name: "Wrist", trait: "Wrist Accessory" },
      // { name: "Wrist Numbers" },
      // { name: "Onion" },
      // { name: "Roots" },
      // { name: "Fastener" },
      // { name: "Tops" },
    ],
  },
];

// Incompatible items can be added to this object by a files cleanName
const incompatible = {
  // BONES: ["Palm"],
  // directory incompatible with directory example
  // GiantPupil: ["Watch", "159753", "222222"],
};

/**
 * Require combinations of files when constructing DNA, this bypasses the
 * randomization and weights.
 *
 * The layer order matters here, the key (left side) is an item within
 * the layer that comes first in the stack.
 * the items in the array are "required" items that should be pulled from folders
 * further in the stack
 */
const forcedCombinations = {
  // floral: ["MetallicShades", "Golden Sakura"],
};

const shuffleLayerConfigurations = false;

const debugLogs = true;

const format = {
  width: 900,
  height: 900,
};

const clamp = {
  brightness: { min: 10, max: 90 },
};

const background = {
  generate: true,
  brightness: "60%",
};

const extraMetadata = () => [];

const rarityDelimiter = "%";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 10,
  thumbWidth: 250,
  imageRatio: format.width / format.height,
  imageName: "preview.png",
};

module.exports = {
  buildDir,
  layersDir,
  format,
  baseUri,
  clamp,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  incompatible,
  forcedCombinations,
  emptyLayerName,
  outputJPEG,
};
