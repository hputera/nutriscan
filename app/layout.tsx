import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NutriScan | Nutrisi & Pilihan Makananmu",
  description:
    "Kenali nutrisi makanan, catat asupan harian, hitung BMI, dan temukan ide menu berdasarkan profilmu.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
