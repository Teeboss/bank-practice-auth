"use client";

import { useState, useEffect, FC } from "react";
import Image from "next/image";

interface TwoFactorSetup {
  onComplete: () => void;
  onCancel: () => void;
}

const TwoFactorSetup: FC<TwoFactorSetup> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1); // 1: QR Code, 2: Verify, 3: Backup Codes
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeSetup();
  }, []);

  const initializeSetup = async () => {
    try {
      const response = await fetch("/api/auth/setup-2fa");
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (error: unknown) {
      setError("Failed to initialize 2FA setup");
    }
  };
  const verifyAndEnable = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/setup-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backupCodes);
        setStep(3);
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (error) {
      setError("Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = `Backup Codes for Two-Factor Authentication\n\nSave these codes in a safe place. Each code can only be used once.\n\n${backupCodes.join(
      "\n"
    )}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (step === 1) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg bg-white shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Enable Two-Factor Authentication
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            1. Install an authenticator app like Google Authenticator or Authy
          </p>
          <p className="text-sm text-gray-600 mb-4">
            2. Scan this QR code with your authenticator app:
          </p>

          {qrCode && (
            <div className="flex justify-center mb-4">
              <Image
                src={qrCode}
                alt="2FA QR Code"
                width={200}
                height={200}
                className="border rounded"
              />
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Or enter this code manually:
            </p>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
              {secret}
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setStep(2)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Next
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg bg-white shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Verify Setup
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={verifyAndEnable}>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Enter the 6-digit code from your authenticator app:
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-lg tracking-wider"
              placeholder="123456"
              maxLength={6}
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
            >
              {loading ? "Verifying..." : "Enable 2FA"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg bg-white shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Save Backup Codes
        </h2>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Two-factor authentication has been enabled! Save these backup codes
            in a safe place. Each code can only be used once to access your
            account if you lose your authenticator device.
          </p>

          <div className="bg-gray-100 p-4 rounded mb-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={downloadBackupCodes}
            className="w-full mb-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Download Backup Codes
          </button>
        </div>

        <button
          onClick={onComplete}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Complete Setup
        </button>
      </div>
    );
  }
};

export default TwoFactorSetup;
