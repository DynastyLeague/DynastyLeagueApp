import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/lib/auth";

export const metadata = {
  title: "Dynasty League App",
  description: "Fantasy Basketball Manager",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black min-h-screen flex flex-col">
        <AuthProvider>
          <main className="pb-32 flex-grow">{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}

