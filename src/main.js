"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");
const keccak256 = require("keccak256");
const { createCanvas, loadImage } = require(path.join(
  basePath,
  "/node_modules/canvas"
));

console.log(path.join(basePath, "/src/config.js"));
const {
  buildDir,
  layersDir,
  format,
  baseUri,
  description,
  background,
  clamp,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  incompatible,
  forcedCombinations,
  fillGroups,
  extraMetadata,
  emptyLayerName,
  outputJPEG,
} = require(path.join(basePath, "/src/config.js"));
const canvas = createCanvas(format.width, format.height);
const ctxMain = canvas.getContext("2d");
var metadataList = [];
var attributesList = [];

var dnaList = new Set();
const DNA_DELIMITER = "*";

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(path.join(buildDir, "/json"));
  fs.mkdirSync(path.join(buildDir, "/images"));
};

const getRarityWeight = (_path) => {
  const weight = _path.split(rarityDelimiter).pop().split(".")[0];
  const weightNumber = weight ? Number(weight) : null;

  if (!weightNumber || isNaN(weightNumber)) {
    return "required";
  }
  return weightNumber;
};

const cleanDna = (_str) => {
  var dna = _str.split(":").shift();
  return dna;
};

const cleanName = (_str) => {
  const extension = /\.[0-9a-zA-Z]+$/;
  const hasExtension = extension.test(_str);
  let nameWithoutExtension = hasExtension ? _str.slice(0, -4) : _str;
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const parseQueryString = (filename) => {
  const query = /\?(.*)\./;
  const querystring = query.exec(filename);
  if (!querystring) {
    return { blendmode: "source-over", opacity: 1 };
  }

  const layerstyles = querystring[1].split("&").reduce((r, setting) => {
    const keyPairs = setting.split("=");
    return { ...r, [keyPairs[0]]: keyPairs[1] };
  }, []);

  return {
    blendmode: layerstyles.blend ? layerstyles.blend : "source-over",
    opacity: layerstyles.opacity ? layerstyles.opacity / 100 : 1,
  };
};

/**
 * Given some input, creates a sha256 hash.
 * @param {Object} input
 */
const hash = (input) => {
  const hashable = typeof input === Buffer ? input : JSON.stringify(input);
  return keccak256(hashable).toString("hex");
};

const getElements = (path, layer) => {
  return fs
    .readdirSync(path)
    .filter((item) => {
      return !/(^|\/)\.[^\/\.]/g.test(item);
    })
    .map((i, index) => {
      const extension = /\.[0-9a-zA-Z]+$/;
      const sublayer = !extension.test(i);
      const weight = getRarityWeight(i);
      const fill = /(-FILL)/.test(i); // bool if
      const colorGroup =
        fill && i.match(/&([a-zA-Z]*)/) ? i.match(/&([a-zA-Z]*)/)[1] : false;

      const { blendmode, opacity } = parseQueryString(i);

      const element = {
        sublayer,
        fill,
        colorGroup,
        blendmode,
        opacity,
        weight,
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
      };
      if (sublayer) {
        element.path = `${path}${i}`;
        const subPath = `${path}${i}/`;
        element.elements = getElements(subPath, layer);
      }

      // Set trait type on layers for metadata
      const lineage = path.split("/");
      let typeAncestor;

      if (weight !== "required") {
        typeAncestor = element.sublayer ? 3 : 2;
      }
      if (weight === "required") {
        typeAncestor = element.sublayer ? 1 : 3;
      }
      // we need to check if the parent is required, or if it's a prop-folder
      if (lineage[lineage.length - typeAncestor].includes(rarityDelimiter)) {
        typeAncestor += 1;
      }

      element.trait =
        layer.trait !== undefined
          ? layer.trait
          : lineage[lineage.length - typeAncestor];

      element.traitValue = getTraitValueFromPath(element, lineage);

      return element;
    });
};

const getTraitValueFromPath = (element, lineage) => {
  // If the element is a required png. then, the trait property = the parent path
  // if the element is a non-required png. black%50.png, then element.name is the value and the parent Dir is the prop
  if (element.weight !== "required") {
    return element.name;
  } else if (element.weight === "required") {
    // if the element is a png that is required, get the traitValue from the parent Dir
    return element.sublayer ? true : cleanName(lineage[lineage.length - 2]);
  }
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => {
    const blendMode =
      layerObj["blend"] != undefined ? layerObj["blend"] : "source-over";

    return {
      id: index,
      name: layerObj.name,
      elements: getElements(`${layersDir}/${layerObj.name}/`, layerObj), // array of all images in
      opacity: layerObj["opacity"] != undefined ? layerObj["opacity"] : 1,
      bypassDNA:
        layerObj.options?.["bypassDNA"] !== undefined
          ? layerObj.options?.["bypassDNA"]
          : false,
    };
  });
  return layers;
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}${outputJPEG ? ".jpg" : ".png"}`,
    canvas.toBuffer(`${outputJPEG ? "image/jpeg" : "image/png"}`)
  );
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = (canvasContext) => {
  canvasContext.fillStyle = genColor();
  canvasContext.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (_dna, _edition, _prefixData) => {
  let dateTime = Date.now();
  const { _prefix, _offset, _imageHash } = _prefixData;

  const combinedAttrs = [...attributesList, ...extraMetadata()];
  const cleanedAttrs = combinedAttrs.reduce((acc, current) => {
    const x = acc.find((item) => item.trait_type === current.trait_type);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  let tempMetadata = {
    dna: hash(_dna),
    name: `${_prefix ? _prefix + " " : ""}#${_edition - _offset}`,
    description: description,
    imageHash: _imageHash,
    image: `${baseUri}/${_edition}${outputJPEG ? ".jpg" : ".png"}`,
    edition: _edition,
    date: dateTime,
    attributes: cleanedAttrs,
  };
  metadataList.push(tempMetadata);
  attributesList = [];
  // main.js currently does not use this return value,
  // it is used by regenerate script and can be used anywhere else
  return tempMetadata;
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer;
  const layerAttributes = {
    trait_type: _element.layer.trait,
    value: selectedElement.traitValue,
  };
  if (
    attributesList.some(
      (attr) => attr.trait_type === layerAttributes.trait_type
    )
  )
    return;
  attributesList.push(layerAttributes);
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    // selected elements is an array.
    const image = await loadImage(`${_layer.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

/**
 * Creates a separate canvas for each render object (layer) and returns the
 * canvas to be rendered on the main canvas.
 * @param {Object} _renderObject Object containing loaded image and layer data
 */
const drawElement = (_renderObject, mainCanvas) => {
  const layerCanvas = createCanvas(format.width, format.height);
  const layerctx = layerCanvas.getContext("2d");

  if (_renderObject.layer.fill) {
    HSLAdjustment(
      layerctx,
      _renderObject.loadedImage,
      _renderObject.layer.colorGroup
    );
  } else {
    layerctx.drawImage(
      _renderObject.loadedImage,
      0,
      0,
      format.width,
      format.height
    );
  }
  addAttributes(_renderObject);
  mainCanvas.drawImage(layerCanvas, 0, 0, format.width, format.height);
  // fs.writeFileSync(
  //   `${buildDir}/images/${_renderObject.layer.colorGroup}-${
  //     100 * Math.random()
  //   }.png`,
  //   layerCanvas.toBuffer("image/png")
  // );
  return layerCanvas;
};

let globalColorGroups = {};

const HSLAdjustment = (ctx, img, colorGroup) => {
  let hue;
  let sat;
  let lightness;

  if (globalColorGroups[colorGroup]) {
    const groupData = globalColorGroups[colorGroup];
    hue = groupData.hue;
    sat = groupData.sat;
    lightness = groupData.lightness;
  } else if (fillGroups[colorGroup]) {
    const colorIndex = Math.floor(
      Math.random() * fillGroups[colorGroup].length
    );
    const hex = fillGroups[colorGroup][colorIndex].color;
    // console.log({
    //   colorGroup,
    //   hex,
    //   name: fillGroups[colorGroup][colorIndex].name,
    // });
    //TODO: maybe handle hex with #'s

    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    [hue, sat, lightness] = rgbToHsl(r, g, b);
    // console.log({ hue, sat, lightness });
    globalColorGroups[colorGroup] = { hue, sat, lightness }; //= the one that was picked
    // add the color to the trait list
    attributesList.push({
      trait_type: colorGroup,
      value: fillGroups[colorGroup][colorIndex].name,
    });
  } else {
    hue = 360 * Math.random(); // a number in the color wheel
    sat = 100 * Math.random();
    lightness =
      Math.random() * (clamp.brightness.max - clamp.brightness.min + 1) +
      clamp.brightness.min;
    // if there is a group with the name in the config fillGroups
    // use that, otherwise randomize

    globalColorGroups[colorGroup] = { hue, sat, lightness };
  }

  // step 1: draw in original image
  // ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(img, 0, 0, format.width, format.height);

  // set composite mode
  ctx.globalCompositeOperation = "source-in";
  // step 2: adjust saturation (chroma, intensity)
  // ctx.globalCompositeOperation = "saturation";

  ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lightness}%)`; // hue doesn't matter here
  ctx.fillRect(0, 0, format.width, format.height);

  // step 3: adjust hue, preserve luma and chroma
  // ctx.globalCompositeOperation = "hue";
  // ctx.fillStyle = "hsl(" + hue + ",1%, 50%)"; // sat must be > 0, otherwise won't matter
  // ctx.fillRect(0, 0, format.width, format.height);

  // step 4: in our case, we need to clip as we filled the entire area
  // ctx.globalCompositeOperation = "destination-in";
  // ctx.drawImage(img, 0, 0, format.width, format.height);

  // step 5: reset comp mode to default
  ctx.globalCompositeOperation = "source-over";
};

function rgbToHsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

/**
 *  Given the randomly generated DNA array,
 *  unwrap the string DNA structure to select the proper layer Object from the
 *  _layers Array
 * @param {*} _dna
 * @param {*} _layers
 * @returns Array of selected layer Objects
 */
const constructLayerToDna = (_dna = [], _layers = []) => {
  const dna = _dna.split(DNA_DELIMITER);
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElements = [];
    const layerImages = dna.filter(
      (element) => element.split(".")[0] == layer.id
    );
    layerImages.forEach((img) => {
      const indexAddress = cleanDna(img);

      //

      const indices = indexAddress.toString().split(".");
      // const firstAddress = indices.shift();
      const lastAddress = indices.pop(); // 1
      // recursively go through each index to get the nested item
      let parentElement = indices.reduce((r, nestedIndex) => {
        if (!r[nestedIndex]) {
          throw new Error("wtf");
        }
        return r[nestedIndex].elements;
      }, _layers); //returns string, need to return

      selectedElements.push(parentElement[lastAddress]);
    });
    // If there is more than one item whose root address indicies match the layer ID,
    // continue to loop through them an return an array of selectedElements

    return {
      name: layer.name,
      blendMode: layer.blendMode,
      opacity: layer.opacity,
      selectedElements: selectedElements,
    };
  });
  return mappedDnaToLayers;
};

/**
 * In some cases a DNA string may contain optional query parameters for options
 * such as bypassing the DNA isUnique check, this function filters out those
 * items without modifying the stored DNA.
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const filteredDNA = _dna.split(DNA_DELIMITER).filter((element) => {
    const query = /(\?.*$)/;
    const querystring = query.exec(element);
    if (!querystring) {
      return true;
    }
    const options = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return options.bypassDNA;
  });

  return filteredDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  const query = /(\?.*$)/;
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList, _dna = []) => {
  return !dnaList.has(_dna);
};

// expecting to return an array of strings for each _layer_ that is picked,
// should be a flattened list of all things that are picked randomly AND reqiured
/**
 *
 * @param {Object} layer The main layer, defined in config.layerConfigurations
 * @param {Array} dnaSequence Strings of layer to object mappings to nesting structure
 * @param {Number*} parentId nested parentID, used during recursive calls for sublayers
 * @param {Array*} incompatibleDNA Used to store incompatible layer names while building DNA
 * @param {Array*} forcedDNA Used to store forced layer selection combinations names while building DNA
 *  from the top down
 * @returns Array DNA sequence
 */
function pickRandomElement(
  layer,
  dnaSequence,
  parentId,
  incompatibleDNA,
  forcedDNA,
  bypassDNA
) {
  let totalWeight = 0;
  // Does this layer include a forcedDNA item? ya? just return it.
  const forcedPick = layer.elements.find((element) =>
    forcedDNA.includes(element.name)
  );
  if (forcedPick) {
    debugLogs
      ? console.log(chalk.yellowBright(`Force picking ${forcedPick.name}/n`))
      : null;
    let dnaString = `${parentId}.${forcedPick.id}:${forcedPick.filename}${bypassDNA}`;
    return dnaSequence.push(dnaString);
  }

  if (incompatibleDNA.includes(layer.name) && layer.sublayer) {
    debugLogs
      ? console.log(
          `Skipping incompatible sublayer directory, ${layer.name}`,
          layer.name
        )
      : null;
    return dnaSequence;
  }

  const compatibleLayers = layer.elements.filter(
    (layer) => !incompatibleDNA.includes(layer.name)
  );
  if (compatibleLayers.length === 0) {
    debugLogs
      ? console.log(
          "No compatible layers in the directory, skipping",
          layer.name
        )
      : null;
    return dnaSequence;
  }
  compatibleLayers.forEach((element) => {
    // If there is no weight, it's required, always include it
    // If directory has %, that is % chance to enter the dir
    if (element.weight == "required" && !element.sublayer) {
      let dnaString = `${parentId}.${element.id}:${element.filename}${bypassDNA}`;
      dnaSequence.unshift(dnaString);
      return;
    }
    if (element.weight == "required" && element.sublayer) {
      const next = pickRandomElement(
        element,
        dnaSequence,
        `${parentId}.${element.id}`,
        incompatibleDNA,
        forcedDNA,
        bypassDNA
      );
    }
    if (element.weight !== "required") {
      totalWeight += element.weight;
    }
  });
  // if the entire directory should be ignored???

  // number between 0 - totalWeight
  const currentLayers = compatibleLayers.filter((l) => l.weight !== "required");

  let random = Math.floor(Math.random() * totalWeight);

  for (var i = 0; i < currentLayers.length; i++) {
    // subtract the current weight from the random weight until we reach a sub zero value.
    // Check if the picked image is in the incompatible list
    random -= currentLayers[i].weight;

    // e.g., directory, or, all files within a directory
    if (random < 0) {
      // Check for incompatible layer configurations and only add incompatibilities IF
      // chosing _this_ layer.
      if (incompatible[currentLayers[i].name]) {
        debugLogs
          ? console.log(
              `Adding the following to incompatible list`,
              ...incompatible[currentLayers[i].name]
            )
          : null;
        incompatibleDNA.push(...incompatible[currentLayers[i].name]);
      }
      // Similar to incompaticle, check for forced combos
      if (forcedCombinations[currentLayers[i].name]) {
        debugLogs
          ? console.log(
              chalk.bgYellowBright.black(
                `\nSetting up the folling forced combinations for ${currentLayers[i].name}: `,
                ...forcedCombinations[currentLayers[i].name]
              )
            )
          : null;
        forcedDNA.push(...forcedCombinations[currentLayers[i].name]);
      }
      // if there's a sublayer, we need to concat the sublayers parent ID to the DNA srting
      // and recursively pick nested required and random elements
      if (currentLayers[i].sublayer) {
        return dnaSequence.concat(
          pickRandomElement(
            currentLayers[i],
            dnaSequence,
            `${parentId}.${currentLayers[i].id}`,
            incompatibleDNA,
            forcedDNA,
            bypassDNA
          )
        );
      }

      // none/empty layer handler
      if (currentLayers[i].name === emptyLayerName) {
        return dnaSequence;
      }
      let dnaString = `${parentId}.${currentLayers[i].id}:${currentLayers[i].filename}${bypassDNA}`;
      return dnaSequence.push(dnaString);
    }
  }
}
/**
 * given the nesting structure is complicated and messy, the most reliable way to sort
 * is based on the number of nested indecies.
 * This sorts layers stacking the most deeply nested grandchildren above their
 * immediate ancestors
 * @param {[String]} layers array of dna string sequences
 */
const sortLayers = (layers) => {
  return layers.sort((a, b) => {
    const addressA = a.split(":")[0];
    const addressB = b.split(":")[0];
    return addressA.length - addressB.length;
  });
};

const createDna = (_layers) => {
  let dnaSequence = [];
  let incompatibleDNA = [];
  let forcedDNA = [];

  _layers.forEach((layer) => {
    const layerSequence = [];
    pickRandomElement(
      layer,
      layerSequence,
      layer.id,
      incompatibleDNA,
      forcedDNA,
      layer.bypassDNA ? "?bypassDNA=true" : ""
    );
    const sortedLayers = sortLayers(layerSequence);
    dnaSequence = [...dnaSequence, [sortedLayers]];
  });
  const dnaStrand = dnaSequence.flat(2).join(DNA_DELIMITER);
  return dnaStrand;
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const writeDnaLog = (_data) => {
  fs.writeFileSync(`${buildDir}/_dna.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

/**
 * Paints the given renderOjects to the main canvas context.
 *
 * @param {Array} renderObjectArray Array of render elements to draw to canvas
 * @param {Object} layerData data passed from the current iteration of the loop or configured dna-set
 *
 */
const paintLayers = (canvasContext, renderObjectArray, layerData) => {
  debugLogs ? console.log("Clearing canvas") : null;
  canvasContext.clearRect(0, 0, format.width, format.height);

  const { abstractedIndexes, _background } = layerData;

  renderObjectArray.forEach((renderObject) => {
    // one main canvas
    // each render Object should be a solo canvas
    // append them all to main canbas
    canvasContext.globalAlpha = renderObject.layer.opacity;
    canvasContext.globalCompositeOperation = renderObject.layer.blendmode;
    canvasContext.drawImage(
      drawElement(renderObject, canvasContext),
      0,
      0,
      format.weight,
      format.height
    );
  });
  console.log("_background.generate", _background.generate);
  if (_background.generate) {
    canvasContext.globalCompositeOperation = "destination-over";
    drawBackground(canvasContext);
  }
  globalColorGroups = {};
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
};

const postProcessMetadata = (layerData) => {
  const { abstractedIndexes, layerConfigIndex } = layerData;
  // Metadata options
  const savedFile = fs.readFileSync(
    `${buildDir}/images/${abstractedIndexes[0]}${outputJPEG ? ".jpg" : ".png"}`
  );
  const _imageHash = hash(savedFile);

  // if there's a prefix for the current configIndex, then
  // start count back at 1 for the name, only.
  const _prefix = layerConfigurations[layerConfigIndex].namePrefix
    ? layerConfigurations[layerConfigIndex].namePrefix
    : null;
  // if resetNameIndex is turned on, calculate the offset and send it
  // with the prefix
  let _offset = 0;
  if (layerConfigurations[layerConfigIndex].resetNameIndex) {
    _offset = layerConfigurations.reduce((acc, layer, index) => {
      if (index < layerConfigIndex) {
        acc += layer.growEditionSizeTo;
        return acc;
      }
      return acc;
    }, 0);
  }

  return {
    _imageHash,
    _prefix,
    _offset,
  };
};

const outputFiles = (abstractedIndexes, layerData) => {
  const { newDna, layerConfigIndex } = layerData;
  // Save the canvas buffer to file
  saveImage(abstractedIndexes[0]);

  const { _imageHash, _prefix, _offset } = postProcessMetadata(layerData);

  addMetadata(newDna, abstractedIndexes[0], {
    _prefix,
    _offset,
    _imageHash,
  });

  saveMetaDataSingleFile(abstractedIndexes[0]);
  console.log(
    `Created edition: ${abstractedIndexes[0]}, with DNA: ${hash(newDna)}`
  );
};

const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  for (
    let i = 1;
    i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
      let newDna = createDna(layers);
      if (isDnaUnique(dnaList, newDna)) {
        let results = constructLayerToDna(newDna, layers);
        debugLogs ? console.log("DNA:", newDna.split(DNA_DELIMITER)) : null;
        let loadedElements = [];
        // reduce the stacked and nested layer into a single array
        const allImages = results.reduce((images, layer) => {
          return [...images, ...layer.selectedElements];
        }, []);
        allImages.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });

        await Promise.all(loadedElements).then((renderObjectArray) => {
          const layerData = {
            newDna,
            layerConfigIndex,
            abstractedIndexes,
            _background: background,
          };
          paintLayers(ctxMain, renderObjectArray, layerData);
          outputFiles(abstractedIndexes, layerData);
        });

        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        abstractedIndexes.shift();
      } else {
        // console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          process.exit();
        }
      }
    }
    layerConfigIndex++;
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));
  writeDnaLog(JSON.stringify([...dnaList], null, 2));
};

module.exports = {
  startCreating,
  DNA_DELIMITER,
  createDna,
  constructLayerToDna,
  isDnaUnique,
  loadLayerImg,
  layersSetup,
  paintLayers,
  postProcessMetadata,
  addAttributes,
  addMetadata,
  buildSetup,
  getElements,
  parseQueryString,
  hash,
};
