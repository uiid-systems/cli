import { execa } from "execa";
import path from "path";
import fs from "fs/promises";
import os from "os";

export async function fetchPackage(name: string, version: string) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "uiid-"));
  console.log("Created temp dir:", tempDir);

  try {
    const pkgJsonPath = path.join(tempDir, "package.json");
    const pkgJson = {
      dependencies: {
        [name]: version, // name should already be fully qualified (e.g. "@uiid/layout")
      },
    };
    await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson));
    console.log(
      "Created package.json:",
      await fs.readFile(pkgJsonPath, "utf8")
    );

    // Install the package using npm
    const installResult = await execa("npm", ["install", "--prefix", tempDir]);
    console.log("npm install output:", installResult.stdout);

    const packagePath = path.join(tempDir, "node_modules", name);
    console.log("Package path:", packagePath);

    // Verify the directory exists and show contents
    const files = await fs.readdir(packagePath);
    console.log("Package contents:", files);

    return packagePath;
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}
