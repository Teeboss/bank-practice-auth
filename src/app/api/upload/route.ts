import { promises as fs } from "fs";
import path from "path";
import { NextResponse as resp } from "next/server";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return resp.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsDir, file.name);

  try {
    // Ensure uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(filePath, buffer);
    return resp.json(
      { message: "File uploaded successfully", status: true },
      { status: 200 }
    );
  } catch (err) {
    return resp.json({ error: "Failed to save file" }, { status: 500 });
  }
}
