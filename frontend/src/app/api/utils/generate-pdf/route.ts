import { generatePdf } from '../../../../../backend/src/lib/pdf-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json(); // Assuming content to be put in PDF
    const pdfBuffer = await generatePdf(content); // This needs to return a buffer or similar
    
    // Return PDF as a downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
