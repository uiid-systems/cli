// src/commands/add.ts
import { execa } from "execa";
import fs from "fs/promises";
import ora from "ora";
import path from "path";
import { fetchPackage } from "../utils/fetch-package";
import {
  copyBaseFiles,
  copyStoriesFiles,
  copyTestFiles,
} from "../utils/copy-files";

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
      const [name, version = "latest"] = pkg.split("@");
      return { name, version };
    });

    for (const pkg of pkgSpecs) {
      // 1. Fetch package contents
      await fetchPackage(pkg.name, pkg.version);

      // 2. Create directory structure
      const targetDir = path.join(process.cwd(), options.path || "", pkg.name);
      await fs.mkdir(targetDir, { recursive: true });

      // 3. Copy base files (components, properties, styles)
      await copyBaseFiles(pkg.name, targetDir);

      // 4. Copy optional directories based on flags
      if (options.stories) {
        await copyStoriesFiles(pkg.name, targetDir);
      }
      if (options.tests) {
        await copyTestFiles(pkg.name, targetDir);
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

// Implementation moved to utils

async function updatePackageJson(
  pkgName: string,
  options: { stories?: boolean; tests?: boolean }
) {
  const pkgJsonPath = path.join(process.cwd(), "package.json");
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
