// frontend/app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Bone Fracture Helper (Frontend)",
  description: "Login routing demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: 20 }}>{children}</main>
      </body>
    </html>
  );
}
