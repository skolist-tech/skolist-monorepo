import { Outlet } from "react-router-dom";
import { Header } from "./header";
import { WhatsAppFloat } from "./whatsapp-float";
import { Footer } from "./footer";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
