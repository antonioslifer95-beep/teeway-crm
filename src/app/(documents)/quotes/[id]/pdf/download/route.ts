import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { launchBrowser } from "@/lib/pdf/browser";

// Puppeteer needs the Node runtime; the render depends on the caller's session.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { id: true, quoteNumber: true },
  });
  if (!quote) {
    return new NextResponse("Orçamento não encontrado", { status: 404 });
  }

  const origin = req.nextUrl.origin;
  const host = req.nextUrl.hostname;
  const secure = req.nextUrl.protocol === "https:";
  const target = `${origin}/quotes/${id}/pdf`;
  const cookieHeader = req.headers.get("cookie") ?? "";

  let browser;
  try {
    browser = await launchBrowser();

    // Forward the caller's auth cookies so the protected /pdf page renders as
    // this signed-in user instead of bouncing to the login screen. Cookies are
    // browser-context level (puppeteer v24 moved setCookie off Page).
    if (cookieHeader) {
      const cookies = cookieHeader
        .split(";")
        .map((c) => {
          const idx = c.indexOf("=");
          if (idx === -1) return null;
          const name = c.slice(0, idx).trim();
          const value = c.slice(idx + 1).trim();
          return name
            ? { name, value, domain: host, path: "/", secure }
            : null;
        })
        .filter((c): c is NonNullable<typeof c> => Boolean(c));
      if (cookies.length) await browser.setCookie(...cookies);
    }

    const page = await browser.newPage();
    await page.goto(target, { waitUntil: "networkidle0", timeout: 30_000 });
    // Wait for next/font (Inter) to finish loading so glyphs are painted, not
    // measured mid-swap.
    await page.evaluateHandle("document.fonts.ready");

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      format: "A4",
    });

    const label = (quote.quoteNumber ?? quote.id).replace(/[^\w.-]+/g, "-");

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="orcamento-${label}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[quote pdf download] generation failed", err);
    // Internal, auth-gated tool: surface the real error so it can be diagnosed
    // without Vercel log access.
    const detail =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return new NextResponse(`Falha ao gerar o PDF.\n\n${detail}`, {
      status: 500,
    });
  } finally {
    if (browser) await browser.close();
  }
}
