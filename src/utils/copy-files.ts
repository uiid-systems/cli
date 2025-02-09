import path from "path";
import fs from "fs/promises";

export async function copyDirectory(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function copyBaseFiles(packagePath: string, targetDir: string) {
  const srcDir = path.join(packagePath, "src");

  // Copy required directories
  const requiredDirs = ["components", "properties", "styles"];
  for (const dir of requiredDirs) {
    await copyDirectory(path.join(srcDir, dir), path.join(targetDir, dir));
  }

  // Copy base files
  const baseFiles = ["styles.css", "types.ts"];
  for (const file of baseFiles) {
    await fs.copyFile(path.join(srcDir, file), path.join(targetDir, file));
  }
}

export async function copyStoriesFiles(packagePath: string, targetDir: string) {
  const storiesDir = path.join(packagePath, "src", "stories");
  await copyDirectory(storiesDir, path.join(targetDir, "stories"));
}

export async function copyTestFiles(packagePath: string, targetDir: string) {
  const testsDir = path.join(packagePath, "src", "tests");
  await copyDirectory(testsDir, path.join(targetDir, "tests"));
}
