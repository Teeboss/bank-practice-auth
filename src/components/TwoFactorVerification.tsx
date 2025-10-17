"use client";

import { useState, FC, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";

interface TwoFaVerification {
  onCancel: () => void;
}
const TwoFactorVerification: FC<TwoFaVerification> = ({ onCancel }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const { verify2FA } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await verify2FA(code, useBackupCode);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg bg-white shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Two-Factor Authentication
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {useBackupCode
              ? "Enter backup code"
              : "Enter 6-digit code from your authenticator app"}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-lg tracking-wider"
            placeholder={useBackupCode ? "XXXXXXXX" : "123456"}
            maxLength={useBackupCode ? 8 : 6}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      <div className="flex flex-col space-y-2 text-sm">
        <button
          type="button"
          onClick={() => {
            setUseBackupCode(!useBackupCode);
            setCode("");
            setError("");
          }}
          className="text-blue-600 hover:underline"
        >
          {useBackupCode
            ? "Use authenticator app instead"
            : "Use backup code instead"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-600 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default TwoFactorVerification;
