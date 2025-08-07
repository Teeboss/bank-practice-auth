"use client";

import { useAuth } from "@/lib/auth-context";

interface DashboardClientProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}
export default function DashboardClient({ user }: DashboardClientProps) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl text-gray-700 font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Hello, {user.name}</span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-700 rounded-lg h-96 p-8">
            <h2 className="text-2xl text-gray-700 font-bold mb-4">
              Welcome to your dashboard!
            </h2>
            <p className="text-gray-600">
              This is a protected route. Only authenticated users can see this
              content.
            </p>
            <div className="mt-6 p-4 bg-blue-300 rounded-lg">
              <h3 className="font-semibold">Your Account Info:</h3>
              <p>Name: {user.name}</p>
              <p>Email: {user.email}</p>
              <p>User ID: {user.id}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
