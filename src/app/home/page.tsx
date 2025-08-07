"use client";

import React from "react";
import { useState } from "react";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadBtn, setUploadBtn] = useState<string>("Upload File");

  const handleFileChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadBtn("Uploading...");
    const input = event.currentTarget.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement | null;
    const selectedFile = input?.files?.[0];
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.status) {
      setMessage(data.message);
      setUploadBtn("Upload File");
    } else {
      setMessage(data.error);
    }
  };
  return (
    <div>
      <form
        onSubmit={handleFileChange}
        className="flex flex-col items-center w-[50%] mx-auto rounded-2xl shadow-2xl"
      >
        <input
          placeholder="Upload Here"
          type="file"
          onChange={(e) =>
            setFile(
              e.target.files && e.target.files[0] ? e.target.files[0] : null
            )
          }
          className="border p-2 rounded mb-3"
        />
        <button
          type="submit"
          className="mx-auto block w-[40%] bg-amber-800 rounded-xl text-white font-bold"
        >
          {uploadBtn}
        </button>
        <p className="font-bold text-gray-700 text-xl">{message}</p>
      </form>
    </div>
  );
}
