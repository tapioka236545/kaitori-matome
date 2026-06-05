import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function loadApiKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = loadApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 });
    }
    const client = new Anthropic({ apiKey });
    const formData = await req.formData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = (formData as any).get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "画像が必要です" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mediaType = (file.type || "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `この名刺画像から以下の情報を抽出してください。JSONのみを返してください。余分なテキストは不要です。
{
  "name": "会社名（string）",
  "contactName": "担当者名（string）",
  "phone": "電話番号（string、ハイフン区切り）",
  "email": "メールアドレス（string）"
}
情報が読み取れない場合はそのフィールドを空文字列にしてください。`,
            },
          ],
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "解析結果を取得できませんでした" },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed, { headers: CORS_HEADERS });
  } catch (err: any) {
    console.error("parse-card error:", err?.message ?? err);
    const msg = err?.message ?? "名刺の解析に失敗しました";
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS_HEADERS });
  }
}
