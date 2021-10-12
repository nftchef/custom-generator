const { parseQueryString } = require("../src/main.js");

describe("filename parsing", () => {
  test("Both blend AND Opacity found", () => {
    const test = "some file name%5-FILL?blend=multiply&opacity=40.png";
    const expected = {
      blendmode: "multiply",
      opacity: 0.4,
    };

    const result = parseQueryString(test);

    expect(result).toEqual(expected);
  });

  test("only blend", () => {
    const test = "some file name%5-FILL?blend=multiply.png";
    const expected = {
      blendmode: "multiply",
      opacity: 1,
    };

    const result = parseQueryString(test);

    expect(result).toEqual(expected);
  });

  test("only opacity", () => {
    const test = "some file name%5-FILL?opacity=50.png";
    const expected = {
      blendmode: "source-over",
      opacity: 0.5,
    };

    const result = parseQueryString(test);

    expect(result).toEqual(expected);
  });

  test("Query string without -FILL opacity", () => {
    const test = "some file name%53?opacity=50.png";
    const expected = {
      blendmode: "source-over",
      opacity: 0.5,
    };

    const result = parseQueryString(test);

    expect(result).toEqual(expected);
  });

  test("Query string without #weight or -FILL", () => {
    const test = "some file name?opacity=50&blend=multiply.png";
    const expected = {
      blendmode: "multiply",
      opacity: 0.5,
    };

    const result = parseQueryString(test);

    expect(result).toEqual(expected);
  });
});
