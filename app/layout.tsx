import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata: Metadata = {
  title: "Anti-Stress Playground",
  description:
    "A tiny digital toy box for a happier brain. Pop bubbles, squish jelly, stack stones, breathe, and listen to calm loops — offline-ready.",
  applicationName: "Anti-Stress Playground",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Playground",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1a" },
    { media: "(prefers-color-scheme: light)", color: "#f3f5ff" },
  ],
};

const themeScript = `(function(){try{
  var raw = localStorage.getItem("sr:v1");
  var saved = raw ? JSON.parse(raw) : {};
  var theme = (saved && saved.settings && saved.settings.theme) || "auto";
  if (theme === "auto") {
    var h = new Date().getHours();
    theme = h < 6 ? "night" : h < 11 ? "dawn" : h < 17 ? "day" : h < 20 ? "dusk" : "night";
  }
  var root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme === "day" || theme === "dawn" ? "light" : "dark";
  var colors = { dawn:"#fff6ef", day:"#f3f5ff", dusk:"#241a3d", night:"#0a0e1a" };
  var meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = colors[theme] || "#0a0e1a";
  document.head.appendChild(meta);
}catch(e){document.documentElement.dataset.theme="night";}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
