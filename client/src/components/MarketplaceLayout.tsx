import Navbar from "./Navbar";
import Footer from "./Footer";

interface MarketplaceLayoutProps {
  children: React.ReactNode;
}

export default function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
