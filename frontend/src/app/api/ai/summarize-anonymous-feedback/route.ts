// import { summarizeAnonymousFeedback } from '@backend/ai/flows/summarize-anonymous-feedback-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // The underlying flow has been removed.
  return NextResponse.json({ error: "This feature is no longer available." }, { status: 404 });
  /*
  try {
    const body = await req.json();
    const result = await summarizeAnonymousFeedback(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  */
}
