import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // If no API key provided, tell client to use its built-in heuristic parser
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const aiPrompt = `You are a strict JSON task scheduling assistant for an app called Dincharya Focus OS.
Current reference time is ${new Date().toLocaleTimeString('en-US', { hour12: false })}.
Analyze the user's natural language schedule input: "${prompt}"

Return ONLY a valid raw JSON object (no markdown, no backticks) with these exact keys:
{
  "task_title": "Clean concise task name",
  "category": "Deep Work" | "Learning" | "Health" | "Break" | "Admin",
  "start_time": "HH:mm" in 24-hour format,
  "duration_hours": number (e.g. 1.5 for 1 hour 30 min, 0.75 for 45 min, 2 for 2 hours),
  "end_time": "HH:mm" in 24-hour format calculated as start_time + duration_hours,
  "notes": "Any extra detail or context from prompt"
}`;

    const result = await model.generateContent(aiPrompt);
    const text = result.response.text().trim();
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI parse error";
    return NextResponse.json({ fallback: true, error: message }, { status: 200 });
  }
}
