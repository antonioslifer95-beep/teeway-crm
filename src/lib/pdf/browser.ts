import "server-only";
import type { Browser } from "puppeteer-core";

/**
 * Launch a headless Chromium for server-side PDF generation.
 *
 * On Vercel (serverless Linux) we use the bundled, brotli-compressed Chromium
 * from @sparticuz/chromium. Locally we point puppeteer-core at an already
 * installed Chrome so dev machines don't need the ~50MB serverless binary.
 * Override the local path with CHROME_PATH / PUPPETEER_EXECUTABLE_PATH.
 */
export async function launchBrowser(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core");

  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const fs = await import("node:fs");
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter((p): p is string => Boolean(p));

  const executablePath = candidates.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });

  if (!executablePath) {
    throw new Error(
      "Nenhum Chrome local encontrado para gerar o PDF. Defina a variável CHROME_PATH.",
    );
  }

  return puppeteer.launch({ executablePath, headless: true });
}
