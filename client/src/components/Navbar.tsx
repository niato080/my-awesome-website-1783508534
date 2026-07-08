import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, ShoppingCart, Menu, LogOut, User, Moon, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import { startLogin } from "@/const";

export default function Navbar() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/templates?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <nav className="border-b border-border/30 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-lg">✨</span>
            </div>
            <span className="hidden sm:inline font-bold text-lg text-glow">
              Animation Templates
            </span>
          </button>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
            <div className="flex w-full">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-input border-border/50 rounded-l-lg"
              />
              <Button type="submit" size="icon" className="btn-primary rounded-l-none rounded-r-lg">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="btn-secondary"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* Cart */}
            <Button
              onClick={() => setLocation("/cart")}
              variant="outline"
              size="icon"
              className="btn-secondary"
              title="Shopping cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>

            {/* Auth Menu - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={() => setLocation("/profile")}
                    variant="outline"
                    size="icon"
                    className="btn-secondary"
                    title="User profile"
                  >
                    <User className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="icon"
                    className="btn-secondary"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => startLogin()} className="btn-primary text-sm">
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="sm:hidden btn-secondary">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-card/95 border-border/30">
                <div className="space-y-4 mt-8">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch}>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-input border-border/50 text-sm"
                      />
                      <Button type="submit" size="icon" className="btn-primary">
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>

                  {/* Mobile Nav Links */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => setLocation("/templates")}
                      variant="ghost"
                      className="w-full justify-start text-left"
                    >
                      Browse Templates
                    </Button>
                    <Button
                      onClick={() => setLocation("/cart")}
                      variant="ghost"
                      className="w-full justify-start text-left"
                    >
                      Shopping Cart
                    </Button>
                  </div>

                  {/* Mobile Auth */}
                  <div className="border-t border-border/30 pt-4 space-y-2">
                    {isAuthenticated ? (
                      <>
                        <p className="text-sm text-muted-foreground px-2">
                          {user?.name || user?.email}
                        </p>
                        <Button
                          onClick={() => setLocation("/profile")}
                          variant="ghost"
                          className="w-full justify-start text-left"
                        >
                          <User className="w-4 h-4 mr-2" />
                          My Profile
                        </Button>
                        <Button
                          onClick={handleLogout}
                          variant="ghost"
                          className="w-full justify-start text-left text-destructive"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => startLogin()}
                        className="w-full btn-primary"
                      >
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
