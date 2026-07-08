import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Search, Zap, Heart, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

export default function Templates() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<"newest" | "popularity" | "price-low" | "price-high">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const categoriesQuery = trpc.categories.getAll.useQuery();

  const offset = (currentPage - 1) * itemsPerPage;
  const templatesQuery = trpc.templates.search.useQuery({
    query: searchQuery,
    categoryId: selectedCategory,
    minPrice,
    maxPrice,
    sortBy,
    limit: itemsPerPage,
    offset,
  });

  const totalPages = useMemo(() => {
    if (!templatesQuery.data) return 1;
    return Math.ceil((templatesQuery.data.total || 0) / itemsPerPage);
  }, [templatesQuery.data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <section className="py-12 border-b border-border/30 bg-card/30">
        <div className="container">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Browse Templates</h1>
          <p className="text-muted-foreground text-lg">Discover the perfect animation template for your celebration</p>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Search */}
              <div>
                <h3 className="font-bold text-lg mb-3">Search</h3>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-input border-border/50"
                  />
                  <Button type="submit" size="icon" className="btn-primary">
                    <Search className="w-4 h-4" />
                  </Button>
                </form>
              </div>

              {/* Categories */}
              {categoriesQuery.data && categoriesQuery.data.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3">Category</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedCategory(undefined);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === undefined
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-card/50"
                      }`}
                    >
                      All Categories
                    </button>
                    {categoriesQuery.data.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === category.id
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-card/50"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div>
                <h3 className="font-bold text-lg mb-3">Price Range</h3>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={minPrice || ""}
                    onChange={(e) => {
                      setMinPrice(e.target.value ? parseFloat(e.target.value) : undefined);
                      setCurrentPage(1);
                    }}
                    className="bg-input border-border/50"
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={maxPrice || ""}
                    onChange={(e) => {
                      setMaxPrice(e.target.value ? parseFloat(e.target.value) : undefined);
                      setCurrentPage(1);
                    }}
                    className="bg-input border-border/50"
                  />
                </div>
              </div>

              {/* Reset Button */}
              <Button onClick={handleReset} variant="outline" className="w-full btn-secondary">
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-8">
              <p className="text-muted-foreground">
                {templatesQuery.data?.total || 0} templates found
              </p>
              <Select value={sortBy} onValueChange={(value: any) => {
                setSortBy(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-48 bg-input border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="popularity">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Templates Grid */}
            {templatesQuery.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card-cosmic h-80 animate-shimmer" />
                ))}
              </div>
            ) : templatesQuery.data && templatesQuery.data.templates.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {templatesQuery.data.templates.map((template) => (
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

                      {/* Category Badge */}
                      {template.categoryId && (
                        <p className="text-sm text-muted-foreground mt-1">Category #{template.categoryId}</p>
                      )}

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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="icon"
                      className="btn-secondary"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            variant={page === currentPage ? "default" : "outline"}
                            className={page === currentPage ? "btn-primary" : "btn-secondary"}
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        (page === currentPage - 2 && currentPage > 3) ||
                        (page === currentPage + 2 && currentPage < totalPages - 2)
                      ) {
                        return <span key={page}>...</span>;
                      }
                      return null;
                    })}

                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="icon"
                      className="btn-secondary"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No templates found matching your criteria</p>
                <Button onClick={handleReset} className="btn-primary mt-4">
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
