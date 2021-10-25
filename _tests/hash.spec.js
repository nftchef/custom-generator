const fs = require("fs");
const { hash } = require("../src/main.js");
// const crypto = require("crypto");
const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);

describe("Hashing a DNA", () => {
  test("hashing returns 256 hash", () => {
    const result = hash("foo");
    const expected =
      "837fb5aa99ab7d0392fa43e61f529f072a693fd38032cd4a039793a9f9b4ea42";
    expect(result).toEqual(expected);
  });

  test("hashing a DNA array returns a sha256 hash string", () => {
    const dna = [
      "0.0:Black%1.png",
      "1.1.2:Open-Palm_0021s_0001_OPEN-HAND-FILL&skin.png",
      "1.1.1:Open-Palm_0021s_0000_OPEN-HAND-LINEWORK.png",
      "1.1.0.0:BONES%10.png",
      "1.1.3.5.2:Eye-1-FILL&skin.png",
      "1.1.3.5.1:2Open-Palm_0015s_0002_PALM---Eye-1-IRIS-FILL.png",
      "1.1.3.5.0:1Open-Palm_0015s_0000_PALM---Eye-1-LINEWORK.png",
      "2.0.2:Watchband-FILL.png",
      "2.0.1:Watch-Metal.png",
      "2.0.0:Open-Palm_0019s_0000_WRIST-Watch-LINEWORK.png",
      "3.1:222222%5.png",
    ];
    const result = hash(dna);
    const expected =
      "9e8d0b327c9eafcc529953aeeebbb5028c55fcd369f53092aedc59795d7a155e";
    expect(result).toEqual(expected);
  });

  test("Hashing image returns sha256", () => {
    const image = fs.readFileSync(path.join(basePath, "/_tests/1.png"));
    const result = hash(image);
    const expected =
      "8538e0448039f0a7e5153ad0797fba75631f8230a2d6d95fe9bec0f145fb6ea3";
    expect(result).toEqual(expected);
  });

  test("output canvas hash matches output file hash", () => {
    const image = fs.readFileSync(path.join(basePath, "/_tests/1.png"));
    const metadata = JSON.parse(
      fs.readFileSync(path.join(basePath, "/_tests/1.json"))
    );
    const resultFileHash = hash(image);
    const expectedCanvasHash = metadata.imageHash;
    expect(resultFileHash).toEqual(expectedCanvasHash);
    // console.log({ metadata });
  });
});
