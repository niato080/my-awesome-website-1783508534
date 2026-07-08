import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Sparkles, Zap, Heart, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import MarketplaceLayout from "@/components/MarketplaceLayout";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const featuredQuery = trpc.templates.getFeatured.useQuery({ limit: 6 });
  const categoriesQuery = trpc.categories.getAll.useQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/templates?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <MarketplaceLayout>
      <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-accent">Premium Animation Templates</span>
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                  Celebrate in <span className="glow-text">Style</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-xl">
                  Discover stunning HTML animation templates for every occasion. From birthdays to weddings, make your celebrations unforgettable with beautiful, interactive designs.
                </p>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-12 bg-input border-border/50 text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  type="submit"
                  className="btn-primary h-12 px-8"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </form>

              {/* CTA Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => setLocation("/templates")}
                  className="btn-primary"
                >
                  Browse Templates
                </Button>
                <Button
                  onClick={() => setLocation("/templates")}
                  className="btn-secondary"
                >
                  View All
                </Button>
              </div>
            </div>

            {/* Right Decorative Element */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent/10 rounded-3xl blur-3xl animate-glow-pulse" />
                <div className="absolute inset-0 bg-card/30 backdrop-blur-xl rounded-3xl border border-accent/30 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Sparkles className="w-16 h-16 text-accent mx-auto animate-float" />
                    <p className="text-lg font-semibold text-accent">Cosmic Designs</p>
                    <p className="text-sm text-muted-foreground">Premium templates await</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categoriesQuery.data && categoriesQuery.data.length > 0 && (
        <section className="section-padding bg-card/30 border-y border-border/30">
          <div className="container">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12">Browse by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoriesQuery.data.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setLocation(`/templates?category=${category.id}`)}
                  className="card-cosmic text-center hover:scale-105 transition-transform"
                >
                  <div className="text-3xl mb-3">{category.icon || "🎉"}</div>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Templates Section */}
      <section className="section-padding">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold">Featured Templates</h2>
              <p className="text-muted-foreground mt-2">Handpicked designs for your special moments</p>
            </div>
            <Button
              onClick={() => setLocation("/templates")}
              variant="outline"
              className="hidden sm:inline-flex"
            >
              View All
            </Button>
          </div>

          {featuredQuery.isLoading ? (
            <div className="grid grid-auto gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-cosmic h-64 animate-shimmer" />
              ))}
            </div>
          ) : featuredQuery.data && featuredQuery.data.length > 0 ? (
            <div className="grid grid-auto gap-6">
              {featuredQuery.data.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setLocation(`/template/${template.slug}`)}
                  className="card-cosmic group text-left overflow-hidden"
                >
                  {/* Template Image */}
                  {template.coverImage && (
                    <div className="w-full h-40 bg-gradient-cosmic rounded-lg mb-4 overflow-hidden">
                      <img
                        src={template.coverImage}
                        alt={template.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Template Info */}
                  <h3 className="font-bold text-lg line-clamp-2 group-hover:text-accent transition-colors">
                    {template.title}
                  </h3>

                  {/* Rating */}
                  {template.reviewCount && template.reviewCount > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.round(parseFloat((template.averageRating || 0).toString()))
                                ? "fill-accent text-accent"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({template.reviewCount})
                      </span>
                    </div>
                  )}

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                    <span className="text-lg font-bold text-accent">
                      ${parseFloat(template.price.toString()).toFixed(2)}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors">
                        <Heart className="w-4 h-4 text-accent" />
                      </button>
                      <button className="p-2 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors">
                        <Download className="w-4 h-4 text-accent" />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured templates available yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-card/30 border-y border-border/30">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center">Why Choose Us</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "Premium Quality",
                description: "Hand-crafted templates with attention to every detail",
              },
              {
                icon: Zap,
                title: "Fast & Responsive",
                description: "Optimized for all devices with lightning-fast loading",
              },
              {
                icon: Download,
                title: "Easy Download",
                description: "Get your templates instantly after purchase",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="card-cosmic">
                  <Icon className="w-12 h-12 text-accent mb-4" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-padding">
        <div className="container">
          <div className="card-cosmic max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-muted-foreground mb-6">
              Subscribe to our newsletter for new templates, tips, and exclusive offers
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement)?.value;
                if (email) {
                  try {
                    await trpc.newsletter.subscribe.useMutation().mutateAsync({ email });
                    (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value = "";
                  } catch (error) {
                    console.error("Newsletter subscription failed", error);
                  }
                }
              }}
              className="flex gap-2"
            >
              <Input
                name="email"
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 bg-input border-border/50"
                required
              />
              <Button type="submit" className="btn-primary h-12 px-8">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
    </MarketplaceLayout>
  );
}
