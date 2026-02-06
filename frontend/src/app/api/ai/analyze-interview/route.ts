import { analyzeInterview } from '@backend/ai/flows/analyze-interview-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    const result = await analyzeInterview({ transcript });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
