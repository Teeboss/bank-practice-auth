import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
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
