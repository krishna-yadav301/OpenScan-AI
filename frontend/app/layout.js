import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "OpenScan AI — Explainable 2D Chest Radiography Intelligence",
  description: "Multimodal AI research chatbot with TorchXRayVision DenseNet-121 Grad-CAM heatmaps for chest X-ray findings and Tuberculosis detection.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#100c0a] text-[#f2eef2]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
