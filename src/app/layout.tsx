import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Momentum — habits & focus",
  description: "A minimal habit tracker with a consistency heatmap, paired with a pomodoro timer.",
};

// Applies the saved theme before paint to avoid a flash of the wrong colors.
const themeBootstrap = `try{var r=localStorage.getItem("momentum.v1");var t=r?JSON.parse(r).theme:"system";var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        {children}
      </body>
    </html>
  );
}
