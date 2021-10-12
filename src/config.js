"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { MODE } = require(path.join(basePath, "src/blendMode.js"));
const description =
  "This is the description of your NFT project, remember to replace this";
const baseUri = "ipfs://NewUriToReplace/testing";
const outputJPEG = false;

const layerConfigurations = [
  {
    growEditionSizeTo: 10,
    layersOrder: [
      { name: "Backgrounds" },
      // { name: "Eyeball" },
      { name: "Hand Type" },
      { name: "Wrist" },
      { name: "Tattoo" },
      // { name: "Onion" },
      // { name: "Roots" },
      // { name: "Fastener" },
      // { name: "Tops" },
    ],
  },
];

// Incompatible items can be added to this object by a files cleanName
const incompatible = {
  // BONES: ["789s56"],
  // directory incompatible with directory example
  // GiantPupil: ["Watch", "159753", "222222"],
};

const shuffleLayerConfigurations = false;

const debugLogs = false;

const format = {
  width: 510,
  height: 510,
};

const clamp = {
  brightness: { min: 10, max: 90 },
};

const background = {
  generate: true,
  brightness: "60%",
};

const extraMetadata = {};

const rarityDelimiter = "%";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 10,
  thumbWidth: 250,
  imageRatio: format.width / format.height,
  imageName: "preview.png",
};

module.exports = {
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
  outputJPEG,
};
