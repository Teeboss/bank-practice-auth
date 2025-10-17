import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { authenticator } from "otplib";
import { redirect } from "next/navigation";
import DB from "./db";

interface User {
  id: string;
  name: string;
  email: string;
  google_id?: string;
  insertId?: number | string;
  provider?: string;
  image?: string;
  backup_codes?: string | object | undefined;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const getUser = async () => {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("token");

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token.value);
    if (!decoded) {
      return null;
    }

    interface User {
      id: string;
      name: string;
      email: string;
    }
    let userId: string | undefined;
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "userId" in decoded
    ) {
      userId = (decoded as { userId: string }).userId;
    }
    if (!userId) {
      return null;
    }
    const users = (await DB("SELECT id, name, email FROM users WHERE id = ?", [
      userId,
    ])) as User[];

    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
};

export const requireAuth = async () => {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
};
// Google OAuth helpers
type GoogleProfile = {
  sub: string;
  name: string;
  email: string;
  picture: string;
  aud: string; // Audience
};
export const createGoogleUser = async (googleProfile: GoogleProfile) => {
  try {
    // Check if user already exists
    const existingUsers = (await DB(
      "SELECT * FROM users WHERE google_id = ? OR email = ?",
      [googleProfile.sub, googleProfile.email]
    )) as User[];

    if (existingUsers.length > 0) {
      // Update existing user with Google info if needed
      const user = existingUsers[0];
      if (!user.google_id) {
        await DB(
          "UPDATE users SET google_id = ?, provider = ?, image = ? WHERE id = ?",
          [googleProfile.sub, "google", googleProfile.picture, user.id]
        );
      }
      return user;
    }

    // Create new user
    const result = (await DB(
      "INSERT INTO users (name, email, google_id, provider, image) VALUES (?, ?, ?, ?, ?)",
      [
        googleProfile.name,
        googleProfile.email,
        googleProfile.sub,
        "google",
        googleProfile.picture,
      ]
    )) as User;

    const newUser = (await DB("SELECT * FROM users WHERE id = ?", [
      result.insertId,
    ])) as User[];

    return newUser[0];
  } catch (error) {
    console.error("Error creating Google user:", error);
    throw error;
  }
};

export const verifyGoogleToken = async (idToken: string) => {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) {
      throw new Error("Invalid Google token");
    }

    const googleProfile = await response.json();

    // Verify the token is for our app
    if (googleProfile.aud !== process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      throw new Error("Invalid audience");
    }

    return googleProfile;
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return null;
  }
};

// 2FA Utilities
export const generate2FASecret = () => {
  return authenticator.generateSecret();
};

interface generateQR {
  email: string;
  secret: string;
  appName: string;
}
export const generate2FAQRCode = ({
  email,
  secret,
  appName = "Your App",
}: generateQR) => {
  const otpauth = authenticator.keyuri(email, appName, secret);
  return otpauth;
};

interface verify2Fa {
  token: string;
  secret: string;
}
export const verify2FAToken = ({ token, secret }: verify2Fa): boolean => {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
};

export const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
};

interface veriBankUpCode {
  userId: string;
  code: string;
}
export const verifyBackupCode = async ({ userId, code }: veriBankUpCode) => {
  try {
    const users = (await DB("SELECT backup_codes FROM users WHERE id = ?", [
      userId,
    ])) as User[];

    if (users.length === 0) return false;

    const rawBackupCodes = users[0].backup_codes;

    const backupCodes =
      typeof rawBackupCodes === "string"
        ? JSON.parse(rawBackupCodes)
        : rawBackupCodes || [];
    const codeIndex = backupCodes.indexOf(code.toUpperCase());

    if (codeIndex === -1) return false;

    // Remove the used backup code
    backupCodes.splice(codeIndex, 1);
    await DB("UPDATE users SET backup_codes = ? WHERE id = ?", [
      JSON.stringify(backupCodes),
      userId,
    ]);

    return true;
  } catch (error) {
    console.error("Backup code verification error:", error);
    return false;
  }
};
