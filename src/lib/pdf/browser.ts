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
    // @sparticuz/chromium only extracts its AL2023 shared libraries (libnss3 et
    // al.) and registers them on LD_LIBRARY_PATH when it detects an AWS Lambda
    // Node 20/22 runtime through AWS_EXECUTION_ENV (helper.js). Vercel functions
    // run on that same AL2023 base image but don't expose that variable in the
    // form the package checks, so the libs are never wired up and Chromium dies
    // with "libnss3.so: cannot open shared object file". Force the detection
    // before importing the package — its module-load side effect and
    // executablePath() both read this — so the libs extract to /tmp/al2023/lib
    // and LD_LIBRARY_PATH points there.
    const execEnv = process.env.AWS_EXECUTION_ENV ?? "";
    if (!execEnv.includes("20.x") && !execEnv.includes("22.x")) {
      process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs20.x";
    }

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
