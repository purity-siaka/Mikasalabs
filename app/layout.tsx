import "./globals.css";

export const metadata = {
  title: "Mikasa Labs",
  description: "Technology Without Limits",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
