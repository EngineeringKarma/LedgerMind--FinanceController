import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import CommandPalette from "@/components/CommandPalette";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LedgerMind — AI Finance Controller",
  description: "AI-powered transaction categorization and financial reporting",
};

/* FOUC guard: runs before React hydrates — sets data-theme from localStorage
   so the correct theme is painted on first pixel. Without this, the default
   attribute in HTML (vault) would flash before React corrects it from storage. */
const foucGuardScript = `
(function(){
  var t = localStorage.getItem('ledgermind-theme');
  var valid = ['vault','midnight','ledger','audit'];
  if (t && valid.indexOf(t) !== -1) {
    document.documentElement.setAttribute('data-theme', t);
  } else {
    document.documentElement.setAttribute('data-theme', 'vault');
  }
})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="vault"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        {/* Blocking inline script — must run before any paint to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: foucGuardScript }} />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          {/* Command palette available globally on all pages via ⌘K */}
          <CommandPalette />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}