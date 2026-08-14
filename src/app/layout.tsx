import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/app/providers";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import "./globals.css";

// X uses proprietary Chirp. Inter is the closest licensed grotesque.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_TAGLINE,
};

const themeBoot = `(function(){try{var t=localStorage.getItem("cl_theme_v2");var d=t!=="light";if(d){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}else{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";}}catch(e){document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
