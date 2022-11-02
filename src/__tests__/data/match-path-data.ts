import { join, dirname } from "path";
import { removeExtension } from "../../filesystem";
import { RequestModuleParent } from "../../try-path";

export interface OneTest {
  readonly name: string;
  readonly only?: boolean;
  readonly skip?: boolean;
  readonly absoluteBaseUrl: string;
  readonly paths: { [key: string]: Array<string> };
  readonly moduleSuffixes: string[];
  readonly mainFields?: (string | string[])[];
  readonly addMatchAll?: boolean;
  readonly existingFiles: ReadonlyArray<string>;
  readonly requestedModule: string;
  readonly requestedModuleParent: RequestModuleParent;
  readonly extensions: ReadonlyArray<string>;
  readonly packageJson?: {};
  readonly expectedPath: string | undefined;
}

const defaultExtensionsWhenRunningInTsNode = [
  ".js",
  ".json",
  ".node",
  ".ts",
  ".tsx",
];

export const tests: ReadonlyArray<OneTest> = [
  {
    name: "should locate path that matches with star and exists",
    absoluteBaseUrl: "/root/",
    paths: {
      "lib/*": ["location/*"],
    },
    moduleSuffixes: [],
    existingFiles: [join("/root", "location", "mylib", "index.ts")],
    requestedModule: "lib/mylib",
    requestedModuleParent: undefined,
    expectedPath: dirname(join("/root", "location", "mylib", "index.ts")),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should resolve to correct path when many are specified",
    absoluteBaseUrl: "/root/",
    paths: {
      "lib/*": ["foo1/*", "foo2/*", "location/*", "foo3/*"],
    },
    moduleSuffixes: [],
    existingFiles: [join("/root", "location", "mylib", "index.ts")],
    requestedModule: "lib/mylib",
    requestedModuleParent: undefined,
    extensions: [".ts"],
    expectedPath: dirname(join("/root", "location", "mylib", "index.ts")),
  },
  {
    name:
      "should locate path that matches with star and prioritize pattern with longest prefix",
    absoluteBaseUrl: "/root/",
    paths: {
      "*": ["location/*"],
      "lib/*": ["location/*"],
    },
    moduleSuffixes: [],
    existingFiles: [
      join("/root", "location", "lib", "mylib", "index.ts"),
      join("/root", "location", "mylib", "index.ts"),
    ],
    requestedModule: "lib/mylib",
    requestedModuleParent: undefined,
    expectedPath: dirname(join("/root", "location", "mylib", "index.ts")),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should locate path that matches with star and exists with extension",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    moduleSuffixes: [],
    existingFiles: [join("/root", "location", "mylib.myext")],
    requestedModule: "lib/mylib",
    requestedModuleParent: undefined,
    extensions: [".js", ".myext"],
    expectedPath: removeExtension(join("/root", "location", "mylib.myext")),
  },
  {
    name: "should resolve request with extension specified",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    moduleSuffixes: [],
    existingFiles: [join("/root", "location", "test.jpg")],
    requestedModule: "lib/test.jpg",
    requestedModuleParent: undefined,
    expectedPath: join("/root", "location", "test.jpg"),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should locate path that matches without star and exists",
    absoluteBaseUrl: "/root/",
    paths: {
      "lib/foo": ["location/foo"],
    },
    moduleSuffixes: [],
    existingFiles: [join("/root", "location", "foo.ts")],
    requestedModule: "lib/foo",
    requestedModuleParent: undefined,
    expectedPath: removeExtension(join("/root", "location", "foo.ts")),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should resolve to parent folder when filename is in subfolder",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    moduleSuffixes: [],
    existingFiles: [join("/root", "location", "mylib", "index.ts")],
    requestedModule: "lib/mylib",
    requestedModuleParent: undefined,
    expectedPath: dirname(join("/root", "location", "mylib", "index.ts")),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should resolve from main field in package.json",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    moduleSuffixes: [],
    existingFiles: [join("/root", "location", "mylib", "kalle.ts")],
    packageJson: { main: "./kalle.ts" },
    requestedModule: "lib/mylib",
    requestedModuleParent: undefined,
    expectedPath: join("/root", "location", "mylib", "kalle.ts"),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should resolve from main field in package.json (js)",
    absoluteBaseUrl: "/root",
    paths: { "lib/*": ["location/*"] },
    moduleSuffixes: [],
    existingFiles: [join("/root", "location", "mylib.js", "kalle.js")],
    packageJson: { main: "./kalle.js" },
    requestedModule: "lib/mylib.js",
    requestedModuleParent: undefined,
    extensions: [".ts", ".js"],
    expectedPath: join("/root", "location", "mylib.js", "kalle.js"),
  },
  {
    name: "should resolve from list of fields by priority in package.json",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    moduleSuffixes: [],
    mainFields: ["missing", "browser", "main"],
    packageJson: { main: "./main.js", browser: "./browser.js" },
    existingFiles: [
      join("/root", "location", "mylibjs", "main.js"), // mainFilePath
      join("/root", "location", "mylibjs", "browser.js"), // browserFilePath
    ],
    extensions: [".ts", ".js"],
    requestedModule: "lib/mylibjs",
    requestedModuleParent: undefined,
    expectedPath: join("/root", "location", "mylibjs", "browser.js"),
  },
  {
    name: "should ignore field mappings to missing files in package.json",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    moduleSuffixes: [],
    mainFields: ["browser", "main"],
    existingFiles: [join("/root", "location", "mylibjs", "kalle.js")],
    requestedModule: "lib/mylibjs",
    requestedModuleParent: undefined,
    packageJson: {
      main: "./kalle.js",
      browser: "./nope.js",
    },
    extensions: [".ts", ".js"],
    expectedPath: join("/root", "location", "mylibjs", "kalle.js"),
  },
  {
    name: "should resolve nested main fields",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    moduleSuffixes: [],
    mainFields: [["esnext", "main"]],
    packageJson: { esnext: { main: "./main.js" } },
    existingFiles: [join("/root", "location", "mylibjs", "main.js")],
    extensions: [".ts", ".js"],
    requestedModule: "lib/mylibjs",
    requestedModuleParent: undefined,
    expectedPath: join("/root", "location", "mylibjs", "main.js"),
  },
  {
    name: "should ignore advanced field mappings in package.json",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    moduleSuffixes: [],
    existingFiles: [
      join("/root", "location", "mylibjs", "kalle.js"),
      join("/root", "location", "mylibjs", "browser.js"),
    ],
    requestedModule: "lib/mylibjs",
    requestedModuleParent: undefined,
    packageJson: {
      main: "./kalle.js",
      browser: { mylibjs: "./browser.js", "./kalle.js": "./browser.js" },
    },
    extensions: [".ts", ".js"],
    expectedPath: join("/root", "location", "mylibjs", "kalle.js"),
  },
  {
    name: "should resolve to with the help of baseUrl when not explicitly set",
    absoluteBaseUrl: "/root/",
    paths: {},
    moduleSuffixes: [],
    existingFiles: [join("/root", "mylib", "index.ts")],
    requestedModule: "mylib",
    requestedModuleParent: undefined,
    expectedPath: dirname(join("/root", "mylib", "index.ts")),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should not resolve with the help of baseUrl when asked not to",
    absoluteBaseUrl: "/root/",
    paths: {},
    moduleSuffixes: [],
    addMatchAll: false,
    existingFiles: [join("/root", "mylib", "index.ts")],
    requestedModule: "mylib",
    requestedModuleParent: undefined,
    expectedPath: undefined,
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should not locate path that does not match",
    absoluteBaseUrl: "/root/",
    paths: { "lib/*": ["location/*"] },
    moduleSuffixes: [],
    existingFiles: [join("root", "location", "mylib")],
    requestedModule: "mylib",
    requestedModuleParent: undefined,
    expectedPath: undefined,
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should not resolve typings file (index.d.ts)",
    absoluteBaseUrl: "/root/",
    paths: {
      "lib/*": ["location/*"],
    },
    moduleSuffixes: [],
    existingFiles: [join("/root", "location", "mylib", "index.d.ts")],
    requestedModule: "lib/mylib",
    requestedModuleParent: undefined,
    expectedPath: undefined,
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should resolve main file with cjs file extension",
    absoluteBaseUrl: "/root/",
    paths: {},
    moduleSuffixes: [],
    existingFiles: [join("/root", "mylib", "index.cjs")],
    packageJson: {
      main: "./index.cjs",
    },
    requestedModule: "mylib",
    requestedModuleParent: undefined,
    expectedPath: join("/root", "mylib", "index.cjs"),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  // Module suffixes test data
  {
    name:
      "should locate path that matches with star and exists with module suffixes .baz",
    absoluteBaseUrl: "/root/",
    paths: {
      "lib/*": ["location/*"],
    },
    moduleSuffixes: [".bar", ""],
    existingFiles: [
      join("/root", "location", "mylib", "index.bar.ts"),
      join("/root", "location", "mylib", "index.ts"),
    ],
    requestedModule: "lib/mylib",
    requestedModuleParent: undefined,
    expectedPath: removeExtension(
      join("/root", "location", "mylib", "index.bar.ts")
    ),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name:
      "should locate path that matches with star and exists with module suffixes default",
    absoluteBaseUrl: "/root/",
    paths: {
      "lib/*": ["location/*"],
    },
    moduleSuffixes: [".bar", ""],
    existingFiles: [join("/root", "location", "mylib", "index.ts")],
    requestedModule: "lib/mylib",
    requestedModuleParent: undefined,
    expectedPath: dirname(join("/root", "location", "mylib", "index.ts")),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name:
      "should locate path that matches with star and not exists with module suffixes",
    absoluteBaseUrl: "/root/",
    paths: {
      "lib/*": ["location/*"],
    },
    moduleSuffixes: [".bar", ""],
    existingFiles: [join("/root", "location", "mylib", "index.baz.ts")],
    requestedModule: "lib/mylib",
    requestedModuleParent: undefined,
    expectedPath: undefined,
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should exists with module suffixes",
    absoluteBaseUrl: "/root/",
    paths: {},
    moduleSuffixes: [".bar", ""],
    existingFiles: [
      join("/root", "location", "mylib", "index.bar.ts"),
      join("/root", "location", "mylib", "index.ts"),
    ],
    requestedModule: "./index",
    requestedModuleParent: "/root/location/mylib",
    expectedPath: removeExtension(
      join("/root", "location", "mylib", "index.bar.ts")
    ),
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
  {
    name: "should not exists with module suffixes",
    absoluteBaseUrl: "/root/",
    paths: {},
    moduleSuffixes: [".bar", ""],
    existingFiles: [join("/root", "location", "mylib", "index.baz.ts")],
    requestedModule: "./index",
    requestedModuleParent: "/root/location/mylib",
    expectedPath: undefined,
    extensions: defaultExtensionsWhenRunningInTsNode,
  },
];
