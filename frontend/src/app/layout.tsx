import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Movie Match — Movie Recommendation Engine",
  description: "Discover personalized movie recommendations powered by content analysis and clean dark UI aesthetics.",
  keywords: ["movie recommender", "recommendation engine", "movie match", "recommendations", "movie finder", "movies like"],
  authors: [{ name: "Movie Match team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full dark antialiased`}
    >
      <body className="min-h-full bg-black text-zinc-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
