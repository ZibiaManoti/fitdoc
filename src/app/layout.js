"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "../../context/AuthContext";
import BottomBarContainer from "../components/bottom-bar";
import { usePathname } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const hideBottomBar = [
    "/account/signin",
    "/account/signup",
    "/onboarding",
  ].includes(pathname);

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthContextProvider>
          {children}
          {!hideBottomBar && <BottomBarContainer />}
        </AuthContextProvider>
      </body>
    </html>
  );
}
