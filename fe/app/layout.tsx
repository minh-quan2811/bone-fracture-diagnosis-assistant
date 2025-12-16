// frontend/app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Bone Vision Assistant (Frontend)",
  description: "Login routing demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}