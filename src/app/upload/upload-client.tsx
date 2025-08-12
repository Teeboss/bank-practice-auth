// app/upload/upload-client.tsx
"use client";

import { useState } from "react";

interface UploadClientProps {
  user: { name: string };
}

export default function UploadClient({ user }: UploadClientProps) {
  const [prices, setPrices] = useState<string[]>([]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/file-upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setPrices(data.outputText || []);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl text-[#0e0e0e] font-bold mb-6">Upload Page</h1>
        <p className="mb-4 text-[#0e0e0e]">Welcome, {user.name}!</p>

        <div>
          <input
            type="file"
            accept=".pdf,.docx"
            placeholder="Upload your files here"
            onChange={handleUpload}
            className="text-[#0e0e0e]"
          />
          <ul>
            {/* {prices.map((price, idx) => (
              <li className="text-[#0e0e0e]" key={idx}>
                {price}
              </li>
            ))} */}
            <li className="text-[#0e0e0e]">{prices}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
