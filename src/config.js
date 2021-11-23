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
    growEditionSizeTo: 4,
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

const fillGroups = {
  skin: [
    { color: "afafaf", name: "HANDTONE Cool Gray 5 C" },
    { color: "cacaca", name: "HANDTONE 420 C" },
    { color: "e7e7e7", name: "HANDTONE 663 C" },
    { color: "ff959c", name: "HANDTONE 1775 C" },
    { color: "ff95ce", name: "HANDTONE 237 C" },
    { color: "ff71fe", name: "HANDTONE Purple C" },
    { color: "ff82fe", name: "HANDTONE 252 C" },
    { color: "e295ff", name: "HANDTONE 245 C" },
    { color: "796cff", name: "HANDTONE 266 C" },
    { color: "c795ff", name: "HANDTONE 2572 C" },
    { color: "9f95ff", name: "HANDTONE 2655 C" },
    { color: "95abff", name: "HANDTONE 7452 C" },
    { color: "09e0fa", name: "HANDTONE 311 C" },
    { color: "95d3ff", name: "HANDTONE 297 C" },
    { color: "95fff4", name: "HANDTONE 3245 C" },
    { color: "3aff75", name: "HANDTONE 802 C" },
    { color: "95ffb5", name: "HANDTONE 7479 C" },
    { color: "b5ff95", name: "HANDTONE 7487 C" },
    { color: "e0ff95", name: "HANDTONE 374 C" },
    { color: "f1ef50", name: "HANDTONE 395 C" },
    { color: "fffe95", name: "HANDTONE 393 C" },
    { color: "ffd695", name: "HANDTONE 1345 C" },
    { color: "ffbd95", name: "HANDTONE 1555C" },
    { color: "ffa671", name: "HANDTONE 1565 C" },
    { color: "ff843a", name: "HANDTONE 1585 C" },
  ],
};

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
  fillGroups,
  incompatible,
  forcedCombinations,
  emptyLayerName,
  outputJPEG,
};
