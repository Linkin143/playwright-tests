import { defineConfig } from "allure";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ✅ Custom logo from project root
const logoBase64 = readFileSync(resolve(__dirname, "companylogo.png")).toString("base64");
const logo = `data:image/png;base64,${logoBase64}`;

export default defineConfig({
  // ✅ Report name — single source of truth here
  name: "Test Lumen Automation Report",

  // ✅ output removed — controlled by `-o allure-report-tmp` in workflow
  plugins: {
    awesome: {
      options: {
        reportName: "Test Lumen Automation Report",
        logo,
        singleFile: false,
        reportLanguage: "en",
      },
    },
  },
});
