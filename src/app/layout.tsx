import { ReactNode } from "react";
import { AuthProvider } from "../lib/auth-context";
import "./globals.css"; // Adjust path if needed

export const metadata = {
  title: "Authentication App",
  description: "Next.js App Router Authentication with MySQL",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
