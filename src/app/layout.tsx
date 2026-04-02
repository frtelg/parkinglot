import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Parking Lot",
  description: "A local-first parking lot for keeping parallel work visible and under control.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
