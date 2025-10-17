"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import TwoFactorSetup from "./TwoFactorSetup";

const TwoFactorSettings = () => {
  const { user } = useAuth();
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDisable2FA = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/disable-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setSuccess("Two-factor authentication has been disabled");
        setShowDisable(false);
        setPassword("");
        // Refresh user data
        window.location.reload();
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (error) {
      setError("Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={() => {
          setShowSetup(false);
          setSuccess(
            "Two-factor authentication has been enabled successfully!"
          );
          window.location.reload();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg bg-white shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        Two-Factor Authentication
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-700">Status:</span>
          <span
            className={`font-semibold ${
              user?.two_factor_enabled ? "text-green-600" : "text-red-600"
            }`}
          >
            {user?.two_factor_enabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Two-factor authentication adds an extra layer of security to your
          account by requiring a code from your authenticator app when signing
          in.
        </p>
      </div>

      {!user?.two_factor_enabled ? (
        <button
          onClick={() => setShowSetup(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Enable Two-Factor Authentication
        </button>
      ) : (
        <div>
          {!showDisable ? (
            <button
              onClick={() => setShowDisable(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Disable Two-Factor Authentication
            </button>
          ) : (
            <form onSubmit={handleDisable2FA}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Enter your password to disable 2FA:
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
                >
                  {loading ? "Disabling..." : "Disable 2FA"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisable(false);
                    setPassword("");
                    setError("");
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default TwoFactorSettings;
