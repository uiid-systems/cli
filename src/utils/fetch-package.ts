import { execa } from "execa";
import path from "path";
import fs from "fs/promises";
import os from "os";

export async function fetchPackage(name: string, version: string) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "uiid-"));

  try {
    // Create a temporary package.json
    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({ dependencies: { [name]: version } })
    );

    // Install the package using npm (we use npm here since it's most likely to be available)
    await execa("npm", ["install", "--prefix", tempDir]);

    // Return path to the installed package
    return path.join(tempDir, "node_modules", name);
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}
