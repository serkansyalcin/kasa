import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { FeedbackHost } from "@/components/ui/feedback";
import { AppProvider } from "@/lib/store/app-store";
import { FeedbackProvider } from "@/lib/store/feedback-store";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kasa — Kasa Takip",
  description: "Küçük işletmeler için günlük kasa takip uygulaması",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans" suppressHydrationWarning>
        <AppProvider>
          <FeedbackProvider>
            {children}
            <FeedbackHost />
          </FeedbackProvider>
        </AppProvider>
      </body>
    </html>
  );
}
