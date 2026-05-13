import type { Metadata } from "next";
import { Literata, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Literata({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
});

const sans = Source_Sans_3({
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Мир Дверь Мяч - билеты",
  description:
    "Билеты на спектакль \"Мир Дверь Мяч\" (Peace Door Ball), Boutique da Cultura, Lisboa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={display.variable}>
      <body className={`${sans.className} antialiased`}>{children}</body>
    </html>
  );
}
