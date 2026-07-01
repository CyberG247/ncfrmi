import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { ThemeProvider } from "@/hooks/useTheme";

export const Layout = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  </ThemeProvider>
);

export default Layout;
