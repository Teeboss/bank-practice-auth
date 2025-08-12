import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string" || !(file instanceof File)) {
    return NextResponse.json({ message: "File is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name.toLowerCase();

  let text = "";

  if (filename.endsWith(".pdf")) {
    try {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } catch (error) {
      console.error("PDF parse error:", error);
      return NextResponse.json(
        { message: "Failed to parse PDF file" },
        { status: 500 }
      );
    }
  } else if (filename.endsWith(".docx") || filename.endsWith(".doc")) {
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } catch (error) {
      console.error("Word parse error:", error);
      return NextResponse.json(
        { message: "Failed to parse Word document" },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json(
      { message: "Unsupported file type" },
      { status: 400 }
    );
  }

  const priceRegex =
    /(?:₦|\$)?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|NGN)?/g;
  const prices = text.match(priceRegex) || [];

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${text}\n\n use the prices in the text to generate a summary of the document. The prices are: ${prices.join(
              ", "
            )}`,
          },
        ],
      },
    ],
  };

  const responseFromAI = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": "AIzaSyDCgkTxy2Yl-fNs77UbevNWePbGp_4jIJU",
      },
      body: JSON.stringify(requestBody),
    }
  );
  // Step 1: Convert raw response to JSON
  const aiResponseData = await responseFromAI.json();

  // Step 2: Check the full response (for debugging)
  console.log("Full API Response:", aiResponseData);

  // Step 3: Extract the generated text (Google’s format)
  const outputText =
    aiResponseData.candidates?.[0]?.content?.parts?.[0]?.text || "";
  console.log("Generated Text:", outputText);

  return NextResponse.json({ outputText });
}
