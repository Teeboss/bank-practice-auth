import { requireAuth } from "@/lib/auth";

export default async function UploadPage() {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Upload Page</h1>
        <p className="mb-4">Welcome, {user.name}!</p>
        {/* Add your upload form or component here */}
      </div>
    </div>
  );
}
