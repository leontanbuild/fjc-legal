import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FJC Case Research",
  description: "Singapore Family Justice Courts case law research assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
