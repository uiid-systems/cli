#!/usr/bin/env node
import { Command } from "commander";
import { add } from "./commands/add.js";

const program = new Command();

program
  .name("uiid")
  .description("CLI tool for installing UIID packages")
  .version("0.0.0-alpha.0");

program
  .command("add")
  .description("Add UIID packages to your project")
  .argument(
    "<packages...>",
    "Package names with optional versions (e.g., layout@latest)"
  )
  .option("--stories", "Include Storybook stories")
  .option("--tests", "Include Jest tests")
  .option("-p, --path <path>", "Installation path", ".")
  .action(add);

program.parse();
