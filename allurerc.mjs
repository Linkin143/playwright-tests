import { defineConfig } from "allure";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ✅ Reads companylogo.png from project root and converts to base64
const logoBase64 = readFileSync(resolve(__dirname, "companylogo.png")).toString("base64");
const logo = `data:image/png;base64,${logoBase64}`;

export default defineConfig({
  name: "Test Lumen Automation Report",
  output: "./allure-report",
  plugins: {
    awesome: {
      options: {
        reportName: "Test Lumen Automation Report",
        singleFile: false,
        reportLanguage: "en",
        logo,
      },
    },
  },
});
