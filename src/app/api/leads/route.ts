import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * Public lead-capture endpoint, called server-to-server by the marketing site
 * (teeway.pt) when someone submits "Pedir orçamento". Authenticated with a
 * shared secret in the `x-api-key` header (LEAD_API_KEY) so only our own site
 * can create leads. Creates a Client at the LEAD pipeline stage plus a SYSTEM
 * activity capturing what they asked for, so it lands straight in the CRM.
 */

export const runtime = "nodejs";

const leadSchema = z.object({
  contactName: z.string().trim().min(1).max(160),
  companyName: z.string().trim().max(160).optional().default(""),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(60).optional().default(""),
  interest: z.string().trim().max(200).optional().default(""),
  quantity: z.coerce.number().int().min(1).max(9999).optional(),
  message: z.string().trim().max(4000).optional().default(""),
  // Honeypot — real users never fill this. Bots do.
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const expected = process.env.LEAD_API_KEY;
  if (!expected) {
    console.error("[leads] LEAD_API_KEY is not configured");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  if (request.headers.get("x-api-key") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const d = parsed.data;
  // Silently accept honeypot hits (don't tip off bots) but create nothing.
  if (d.website && d.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const bodyLines = [
    "Pedido de orçamento pelo site (teeway.pt).",
    d.interest ? `Interesse: ${d.interest}` : null,
    d.quantity ? `Quantidade: ${d.quantity}` : null,
    d.phone ? `Telefone: ${d.phone}` : null,
    d.message ? `\nMensagem:\n${d.message}` : null,
  ].filter(Boolean);

  try {
    const client = await prisma.client.create({
      data: {
        companyName: d.companyName || d.contactName,
        contactName: d.contactName,
        email: d.email,
        phone: d.phone || null,
        pipelineStage: "LEAD",
        activities: {
          create: {
            type: "SYSTEM",
            body: bodyLines.join("\n"),
          },
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, clientId: client.id }, { status: 201 });
  } catch (err) {
    console.error("[leads] failed to create lead", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
