import {
  Noto_Sans_KR,
  Nanum_Gothic,
  Noto_Serif_KR,
  Bebas_Neue,
  Cormorant_Garamond,
  Syne,
} from "next/font/google";
import "./globals.css";
import { ThemeContextProvider } from "@/context/ThemeContext";
import ThemeProvider from "@/providers/ThemeProvider";
import AuthProvider from "@/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { Metadata } from "next";
import LocalFont from "next/font/local";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

const nanumGothic = Nanum_Gothic({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-nanum-gothic",
  display: "swap",
});

const satoshi = LocalFont({
  src: "../../public/fonts/satoshi/Satoshi-Bold.woff2",
  weight: "700",
  style: "normal",
  variable: "--font-satoshi",
  display: "optional",
});

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-serif-kr",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zindozang",
    template: "%s | Zindozang",
  },
  description: "감성을 설계합니다.",
  openGraph: {
    title: "Zindozang",
    description: "감성을 설계합니다.",
    url: "https://www.zindozang.com",
    siteName: "Zindozang",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="preconnect" href="https://vitals.vercel-analytics.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
      </head>
      <body
        className={`${satoshi.variable} ${notoSansKr.variable} ${nanumGothic.variable} ${notoSerifKR.variable} ${bebasNeue.variable} ${cormorant.variable} ${syne.variable}`}
      >
        <AuthProvider>
          <ThemeContextProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </ThemeContextProvider>
        </AuthProvider>
        <Analytics />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4QDHKQH1M8"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4QDHKQH1M8',{
              anonymize_ip: true,
              cookie_flags: 'SameSite=None; Secure',
              cookie_expires: 63072000,
              send_page_view: false,
            });
          `}
        </Script>
      </body>
    </html>
  );
}
