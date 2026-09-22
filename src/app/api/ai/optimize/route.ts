import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { goals, existingBlocks } = await req.json();

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json({ error: "Missing goals" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a high-performance productivity scheduler for Dincharya Focus OS.
Given the user's goals: ${JSON.stringify(goals)}
And already scheduled blocks today: ${JSON.stringify(existingBlocks?.map((b: { start_time: string; end_time: string; task_title: string }) => ({ start: b.start_time, end: b.end_time, title: b.task_title })))}

Generate an optimized schedule between 08:00 and 22:00 that places each goal into free unallocated gaps without conflicting with existing blocks. Insert a 15-minute Break ("Focus Reset & Hydration") after every deep work block exceeding 1.5 hours.

Return ONLY a raw JSON array of objects with keys:
[
  {
    "task_title": "string",
    "category": "Deep Work" | "Learning" | "Health" | "Break" | "Admin",
    "start_time": "HH:mm",
    "duration_hours": number,
    "end_time": "HH:mm",
    "notes": "string"
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({ blocks: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI optimize error";
    return NextResponse.json({ fallback: true, error: message }, { status: 200 });
  }
}
