import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/require-auth";
import type { AdsAgentReport } from "@/lib/ads-agent/analysis";
import { CELTIC_QUEST_CONTEXT } from "@/lib/ads-agent/celtic-quest-context";

const adSchema = z.object({
  adName: z.string().min(1).max(200),
  spend: z.number().nonnegative(),
  purchases: z.number().nonnegative().nullable(),
  conversionValue: z.number().nonnegative().nullable(),
  costPerPurchase: z.number().nonnegative().nullable(),
  roas: z.number().nonnegative().nullable(),
});

const requestSchema = z.object({
  ads: z.array(adSchema).min(1).max(200),
  totals: z.object({
    spend: z.number().nonnegative(),
    purchases: z.number().nonnegative().nullable(),
    conversionValue: z.number().nonnegative().nullable(),
    costPerPurchase: z.number().nonnegative().nullable(),
    roas: z.number().nonnegative().nullable(),
  }),
  warnings: z.array(z.string()).max(20),
});

const SYSTEM_PROMPT = `You are the read-only Meta Ads Analyst for Celtic Quest Fishing.

Verified Celtic Quest context:
${JSON.stringify(CELTIC_QUEST_CONTEXT)}

Analyze only the supplied calculated performance data. Never invent results, offers, budgets, audiences, schedules, tracking facts, or campaign settings.

Your job is to:
1. Explain performance in plain English.
2. Identify meaningful winners, weaknesses, and data limitations.
3. Recommend what Des should investigate or test next.
4. Draft one campaign concept for human review.

Safety rules:
- You cannot publish or modify Meta ads.
- Do not claim Meta attribution equals confirmed reservation revenue.
- Do not recommend automatic budget or status changes.
- Any campaign concept is a draft only and requires Des's approval.
- If data is missing, say so.
- Never describe Celtic Quest as a Montauk business.
- Use only the verified Celtic Quest context above for business claims.

Return only valid JSON with this exact structure:
{
  "executiveSummary": "string",
  "findings": ["string"],
  "recommendations": ["string"],
  "draftCampaign": {
    "name": "string",
    "objective": "string",
    "rationale": "string",
    "guardrails": ["string"]
  }
}`;

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const parsedRequest = requestSchema.safeParse(await request.json());
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "The imported ad data is incomplete or invalid." },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "The Ads Agent AI key is not configured." },
      { status: 503 }
    );
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1400,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this Meta Ads performance summary:\n${JSON.stringify(
            parsedRequest.data
          )}`,
        },
      ],
    });
    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "");
    const report = JSON.parse(cleaned) as AdsAgentReport;

    if (
      !report.executiveSummary ||
      !Array.isArray(report.findings) ||
      !Array.isArray(report.recommendations) ||
      !report.draftCampaign?.name
    ) {
      throw new Error("The AI response did not match the report format.");
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("[ads-agent] Analysis failed:", error);
    return NextResponse.json(
      { error: "The Ads Agent could not generate its report. Try again." },
      { status: 500 }
    );
  }
}
