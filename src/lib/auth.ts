import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DB from "./db";

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
