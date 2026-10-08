import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar/navbar";
import { SessionProvider } from "next-auth/react";
import {auth} from "../../auth";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Home",
  description: "Hotel UNIDA Gontor",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${raleway.variable} antialiased`}>
        <SessionProvider session={session}>
          <Navbar />
          <main className="bg-gray-50 min-h-screen">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
