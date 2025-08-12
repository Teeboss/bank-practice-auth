// app/upload/page.tsx
import { requireAuth } from "@/lib/auth";
import UploadClient from "./upload-client";

export default async function UploadPage() {
  const user = await requireAuth(); // ✅ Runs on server
  return <UploadClient user={user} />;
}
