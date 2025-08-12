import { NextResponse } from "next/server";
import { verifyGoogleToken, createGoogleUser, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { message: "ID token is required" },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    const googleProfile = await verifyGoogleToken(idToken);

    if (!googleProfile) {
      return NextResponse.json(
        { message: "Invalid Google token" },
        { status: 401 }
      );
    }

    // Create or get user from database
    const user = await createGoogleUser(googleProfile);

    // Generate JWT token
    const token = generateToken(user.id);

    // Create response
    const response = NextResponse.json(
      {
        message: "Google sign-in successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          provider: user.provider,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 604800, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    process.env.NODE_ENV === "production"
      ? console.error("Google sign-in error:")
      : console.error(error);
    return NextResponse.json(
      { message: "Google sign-in failed" },
      { status: 500 }
    );
  }
}
