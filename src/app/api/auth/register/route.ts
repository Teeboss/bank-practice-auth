import { NextRequest, NextResponse } from "next/server";
import DB from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    interface User {
      id: number;
      insertId?: number | string;
      name: string;
      email: string;
      password: string;
    }
    // Check if user already exists
    const existingUsers = (await DB("SELECT id FROM users WHERE email = ?", [
      email,
    ])) as User[];

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const result = (await DB(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    )) as User;

    const userId = result.insertId;
    if (!userId) {
      return NextResponse.json(
        { message: "Failed to create user" },
        { status: 500 }
      );
    }
    const token = generateToken(String(userId));

    const response = NextResponse.json(
      {
        message: "User created successfully",
        user: { id: userId, name, email },
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
