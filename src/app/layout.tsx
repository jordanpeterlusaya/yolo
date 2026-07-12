import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "YOLO Real Estate | Find Your Perfect Property",
    template: "%s | YOLO Real Estate",
  },
  description:
    "Browse houses, apartments, rooms, land, and commercial properties for rent or sale. YOLO Real Estate makes finding your dream property simple and exciting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
