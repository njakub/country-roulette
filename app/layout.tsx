import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Country Roulette",
  description: "Spin the wheel and explore the world, one country at a time!",
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
