import { getPathsToTry } from "../try-path";
import { join } from "path";

describe("mapping-entry", () => {
  const abosolutePathMappings = [
    {
      pattern: "longest/pre/fix/*",
      paths: [join("/absolute", "base", "url", "foo2", "bar")],
    },
    { pattern: "pre/fix/*", paths: [join("/absolute", "base", "url", "foo3")] },
    { pattern: "*", paths: [join("/absolute", "base", "url", "foo1")] },
  ];
  const abosolutePathMappingsStarstWithSlash = [
    {
      pattern: "/opt/*",
      paths: [join("/absolute", "src", "aws-layer")],
    },
    {
      pattern: "*",
      paths: [join("/absolute", "src")],
    },
  ];
  it("should return no paths for relative requested module", () => {
    const result = getPathsToTry(
      [".ts", "tsx"],
      abosolutePathMappings,
      "./requested-module",
      undefined,
      []
    );
    expect(result).toBeUndefined();
  });

  it("should return no paths if no pattern match the requested module", () => {
    const result = getPathsToTry(
      [".ts", "tsx"],
      [
        {
          pattern: "longest/pre/fix/*",
          paths: [join("/absolute", "base", "url", "foo2", "bar")],
        },
        {
          pattern: "pre/fix/*",
          paths: [join("/absolute", "base", "url", "foo3")],
        },
      ],
      "requested-module",
      undefined,
      []
    );
    expect(result).toBeUndefined();
  });

  it("should get all paths that matches requested module", () => {
    const result = getPathsToTry(
      [".ts", ".tsx"],
      abosolutePathMappings,
      "longest/pre/fix/requested-module",
      undefined,
      []
    );
    expect(result).toEqual([
      // "longest/pre/fix/*"
      { type: "file", path: join("/absolute", "base", "url", "foo2", "bar") },
      {
        type: "package",
        path: join("/absolute", "base", "url", "foo2", "bar", "package.json"),
      },
      {
        type: "extension",
        path: join("/absolute", "base", "url", "foo2", "bar.ts"),
      },
      {
        type: "extension",
        path: join("/absolute", "base", "url", "foo2", "bar.tsx"),
      },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo2", "bar", "index.ts"),
      },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo2", "bar", "index.tsx"),
      },
      // "*"
      { type: "file", path: join("/absolute", "base", "url", "foo1") },
      {
        type: "package",
        path: join("/absolute", "base", "url", "foo1", "package.json"),
      },
      { type: "extension", path: join("/absolute", "base", "url", "foo1.ts") },
      { type: "extension", path: join("/absolute", "base", "url", "foo1.tsx") },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo1", "index.ts"),
      },
      {
        type: "index",
        path: join("/absolute", "base", "url", "foo1", "index.tsx"),
      },
    ]);
  });

  it("should resolve paths starting with a slash", () => {
    const result = getPathsToTry(
      [".ts"],
      abosolutePathMappingsStarstWithSlash,
      "/opt/utils",
      undefined,
      []
    );
    expect(result).toEqual([
      // "opt/*"
      {
        path: join("/absolute", "src", "aws-layer"),
        type: "file",
      },
      {
        path: join("/absolute", "src", "aws-layer", "package.json"),
        type: "package",
      },
      {
        path: join("/absolute", "src", "aws-layer.ts"),
        type: "extension",
      },
      {
        path: join("/absolute", "src", "aws-layer", "index.ts"),
        type: "index",
      },
      // "*"
      {
        path: join("/absolute", "src"),
        type: "file",
      },
      {
        path: join("/absolute", "src", "package.json"),
        type: "package",
      },
      {
        path: join("/absolute", "src.ts"),
        type: "extension",
      },
      {
        path: join("/absolute", "src", "index.ts"),
        type: "index",
      },
    ]);
  });

  it("should resolve paths for relative requested module with module suffixes", () => {
    const result = getPathsToTry([".ts", ".tsx"], [], "./utils", "/opt", [
      ".bar",
      "",
    ]);
    expect(result).toEqual([
      {
        isModuleSuffixes: true,
        path: join("/opt", "utils.bar"),
        type: "file",
      },
      {
        path: join("/opt", "utils"),
        type: "file",
      },
      {
        isModuleSuffixes: true,
        path: join("/opt", "utils.bar.ts"),
        type: "extension",
      },
      {
        isModuleSuffixes: true,
        path: join("/opt", "utils.bar.tsx"),
        type: "extension",
      },
      {
        path: join("/opt", "utils.ts"),
        type: "extension",
      },
      {
        path: join("/opt", "utils.tsx"),
        type: "extension",
      },
      {
        isModuleSuffixes: true,
        path: join("/opt", "utils", "index.bar.ts"),
        type: "index",
      },
      {
        isModuleSuffixes: true,
        path: join("/opt", "utils", "index.bar.tsx"),
        type: "index",
      },
      {
        path: join("/opt", "utils", "index.ts"),
        type: "index",
      },
      {
        path: join("/opt", "utils", "index.tsx"),
        type: "index",
      },
    ]);
  });
});
