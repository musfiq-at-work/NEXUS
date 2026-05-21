import "~/styles/globals.css";

import { type Metadata } from "next";
import { Poppins, Rajdhani, Lato } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: "RDL Nexus",
  description: "RDL Nexus Application",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["400", "500", "600", "700"],
});

const lato = Lato({
  subsets: ['latin'],
  variable: '--font-lato',
  weight: ["400", "700"],
})

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${rajdhani.variable} ${lato.variable}`}>
      <body>
        <div>
          <TRPCReactProvider>
            {children}
            <div id='portal-root' /> {/* Global portal root */}
            <Toaster position="top-right" />
          </TRPCReactProvider>
        </div>
      </body>
    </html>
  );
}
