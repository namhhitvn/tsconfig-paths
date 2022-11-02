import * as path from "path";
import { MappingEntry } from "./mapping-entry";
import { dirname } from "path";
import { removeExtension } from "./filesystem";

export interface TryPath {
  readonly type: "file" | "extension" | "index" | "package";
  readonly path: string;
  readonly isModuleSuffixes?: boolean;
}

export type RequestModuleParent =
  | string
  | {
      path: string;
    }
  | undefined;

/**
 * Builds a list of all physical paths to try by:
 * 1. Check for file named exactly as request.
 * 2. Check for files named as request ending in any of the extensions.
 * 3. Check for file specified in package.json's main property.
 * 4. Check for files named as request ending in "index" with any of the extensions.
 */
export function getPathsToTry(
  extensions: ReadonlyArray<string>,
  absolutePathMappings: ReadonlyArray<MappingEntry>,
  requestedModule: string,
  requestedModuleParent: RequestModuleParent,
  moduleSuffixes: string[]
): ReadonlyArray<TryPath> | undefined {
  const pathsToTry: Array<TryPath> = [];
  const isNotValidToResolvePath =
    !absolutePathMappings ||
    !absolutePathMappings.length ||
    !requestedModule ||
    requestedModule[0] === ".";

  if (moduleSuffixes.length) {
    const parentPath =
      typeof requestedModuleParent === "string"
        ? requestedModuleParent
        : requestedModuleParent?.path;
    moduleSuffixes = moduleSuffixes.filter(Boolean);

    if (isNotValidToResolvePath && parentPath) {
      const physicalPath = path.resolve(parentPath, requestedModule);
      pathsToTry.push(
        ...getTryPaths(physicalPath, extensions, moduleSuffixes, true)
      );
      return pathsToTry;
    }
  }

  if (isNotValidToResolvePath) {
    return undefined;
  }

  for (const entry of absolutePathMappings) {
    const starMatch =
      entry.pattern === requestedModule
        ? ""
        : matchStar(entry.pattern, requestedModule);
    if (starMatch !== undefined) {
      for (const physicalPathPattern of entry.paths) {
        const physicalPath = physicalPathPattern.replace("*", starMatch);
        pathsToTry.push(
          ...getTryPaths(physicalPath, extensions, moduleSuffixes)
        );
      }
    }
  }
  return pathsToTry.length === 0 ? undefined : pathsToTry;
}

function getTryPaths(
  physicalPath: string,
  extensions: ReadonlyArray<string>,
  moduleSuffixes: string[],
  onlyModuleSuffixes: boolean = false
): Array<TryPath> {
  const pathsToTry: Array<TryPath> = [];

  pathsToTry.push(
    ...[
      ...moduleSuffixes.map(
        (m) =>
          ({
            type: "file",
            path: physicalPath + m,
            isModuleSuffixes: true,
          } as TryPath)
      ),
      { type: "file", path: physicalPath } as TryPath,
    ]
  );

  if (!onlyModuleSuffixes) {
    pathsToTry.push({
      type: "package",
      path: path.join(physicalPath, "/package.json"),
    });
  }

  pathsToTry.push(
    ...moduleSuffixes.reduce(
      (arr, m) => [
        ...arr,
        ...extensions.map(
          (e) =>
            ({
              type: "extension",
              path: physicalPath + m + e,
              isModuleSuffixes: true,
            } as TryPath)
        ),
      ],
      [] as TryPath[]
    ),
    ...extensions.map(
      (e) => ({ type: "extension", path: physicalPath + e } as TryPath)
    )
  );

  const indexPath = path.join(physicalPath, "/index");
  pathsToTry.push(
    ...moduleSuffixes.reduce(
      (arr, m) => [
        ...arr,
        ...extensions.map(
          (e) =>
            ({
              type: "index",
              path: indexPath + m + e,
              isModuleSuffixes: true,
            } as TryPath)
        ),
      ],
      [] as TryPath[]
    ),
    ...extensions.map(
      (e) => ({ type: "index", path: indexPath + e } as TryPath)
    )
  );

  return pathsToTry;
}

// Not sure why we don't just return the full found path?
export function getStrippedPath(tryPath: TryPath): string {
  return tryPath.isModuleSuffixes && tryPath.type === "index"
    ? removeExtension(tryPath.path)
    : tryPath.type === "index"
    ? dirname(tryPath.path)
    : tryPath.type === "file"
    ? tryPath.path
    : tryPath.type === "extension"
    ? removeExtension(tryPath.path)
    : tryPath.type === "package"
    ? tryPath.path
    : exhaustiveTypeException(tryPath.type);
}

export function exhaustiveTypeException(check: never): never {
  throw new Error(`Unknown type ${check}`);
}

/**
 * Matches pattern with a single star against search.
 * Star must match at least one character to be considered a match.
 *
 * @param patttern for example "foo*"
 * @param search for example "fooawesomebar"
 * @returns the part of search that * matches, or undefined if no match.
 */
function matchStar(pattern: string, search: string): string | undefined {
  if (search.length < pattern.length) {
    return undefined;
  }
  if (pattern === "*") {
    return search;
  }
  const star = pattern.indexOf("*");
  if (star === -1) {
    return undefined;
  }
  const part1 = pattern.substring(0, star);
  const part2 = pattern.substring(star + 1);
  if (search.substr(0, star) !== part1) {
    return undefined;
  }
  if (search.substr(search.length - part2.length) !== part2) {
    return undefined;
  }
  return search.substr(star, search.length - part2.length);
}
