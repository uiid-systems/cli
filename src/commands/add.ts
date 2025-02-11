// src/commands/add.ts
import { execa } from "execa";
import fs from "fs/promises";
import ora from "ora";
import path from "path";
import { fetchPackage } from "../utils/fetch-package.js";
import {
  copyBaseFiles,
  copyStoriesFiles,
  copyTestFiles,
} from "../utils/copy-files.js";

interface AddOptions {
  stories?: boolean;
  tests?: boolean;
  path?: string;
}

const BASE_DEPENDENCIES = {
  "@uiid/core": "latest",
  react: "^19.0.0",
  "react-dom": "^19.0.0",
};

const STORIES_DEPENDENCIES = {
  "@storybook/addon-essentials": "^8.5.3",
  "@storybook/blocks": "^8.5.3",
  "@storybook/react": "^8.5.3",
  "@storybook/react-vite": "^8.5.3",
  "@storybook/test": "^8.5.3",
  storybook: "^8.5.3",
};

const TESTS_DEPENDENCIES = {
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/react": "^16.2.0",
  vitest: "^3.0.5",
  "happy-dom": "^17.0.0",
};

export async function add(packages: string[], options: AddOptions) {
  const spinner = ora("Installing packages...").start();

  try {
    // Parse package names and versions
    const pkgSpecs = packages.map((pkg) => {
      // For bare package names like "layout", prepend the full scope
      if (!pkg.includes("@")) {
        return { name: "@uiid/layout", version: "latest" };
      }

      // For versioned packages like "layout@1.0.0", prepend the scope
      if (pkg.startsWith("layout@")) {
        const version = pkg.split("@")[1];
        return { name: "@uiid/layout", version };
      }

      // For fully qualified names like "@uiid/layout@1.0.0", split properly
      const parts = pkg.split("@");
      const version = parts[2] || "latest";
      return { name: "@uiid/" + parts[1], version };
    });

    for (const pkg of pkgSpecs) {
      // 1. Fetch package contents
      const packagePath = await fetchPackage(pkg.name, pkg.version);

      // 2. Create directory structure
      // If a path is provided, use it as the base directory, otherwise use current directory
      const baseDir = options.path
        ? path.resolve(process.cwd(), options.path)
        : process.cwd();

      // Create a subdirectory for each package
      const packageName = pkg.name.split("/")[1]; // Gets 'layout' from '@uiid/layout'
      const targetDir = path.join(baseDir, packageName);

      // Ensure the directory exists
      await fs.mkdir(targetDir, { recursive: true });

      // 3. Copy base files (components, properties, styles)
      await copyBaseFiles(packagePath, targetDir);

      // 4. Copy optional directories based on flags
      if (options.stories) {
        await copyStoriesFiles(packagePath, targetDir);
      }
      if (options.tests) {
        await copyTestFiles(packagePath, targetDir);
      }

      // 5. Update package.json with dependencies
      await updatePackageJson(pkg.name, {
        stories: options.stories,
        tests: options.tests,
      });
    }

    // 6. Create or update uiid.config.ts
    await updateConfig(pkgSpecs, options);

    spinner.succeed("Packages installed successfully");
  } catch (error) {
    spinner.fail("Failed to install packages");
    console.error(error);
    process.exit(1);
  }
}

async function updatePackageJson(
  pkgName: string,
  options: { stories?: boolean; tests?: boolean }
) {
  // Find the nearest package.json by walking up directories
  let currentDir = process.cwd();
  let pkgJsonPath: string | null = null;

  while (currentDir !== path.parse(currentDir).root) {
    const testPath = path.join(currentDir, "package.json");
    try {
      await fs.access(testPath);
      pkgJsonPath = testPath;
      break;
    } catch {
      currentDir = path.dirname(currentDir);
    }
  }

  if (!pkgJsonPath) {
    throw new Error(
      "Could not find package.json in current directory or any parent directory"
    );
  }

  const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf-8"));

  // Add base dependencies
  pkgJson.dependencies = {
    ...pkgJson.dependencies,
    ...BASE_DEPENDENCIES,
  };

  // Add optional dependencies
  if (options.stories) {
    pkgJson.devDependencies = {
      ...pkgJson.devDependencies,
      ...STORIES_DEPENDENCIES,
    };
  }

  if (options.tests) {
    pkgJson.devDependencies = {
      ...pkgJson.devDependencies,
      ...TESTS_DEPENDENCIES,
    };
  }

  await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
}

async function updateConfig(
  packages: Array<{ name: string; version: string }>,
  options: AddOptions
) {
  const configPath = path.join(process.cwd(), "uiid.config.ts");
  // TODO: Create or update config file
}
