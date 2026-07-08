import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Heart, Share2, Download, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function TemplateDetail() {
  const [match, params] = useRoute("/template/:slug");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);

  if (!match) return null;

  const slug = params?.slug as string;
  const templateQuery = trpc.templates.getBySlug.useQuery({ slug });
  const reviewsQuery = trpc.reviews.getForTemplate.useQuery(
    { templateId: templateQuery.data?.id || 0 },
    { enabled: !!templateQuery.data?.id }
  );
  const relatedQuery = trpc.templates.getRelated.useQuery(
    { templateId: templateQuery.data?.id || 0, limit: 4 },
    { enabled: !!templateQuery.data?.id }
  );

  const addToCartMutation = trpc.cart.addItem.useMutation();
  const addToWishlistMutation = trpc.wishlist.addItem.useMutation();

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }
    if (templateQuery.data?.id) {
      await addToCartMutation.mutateAsync({ templateId: templateQuery.data.id });
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }
    if (templateQuery.data?.id) {
      await addToWishlistMutation.mutateAsync({ templateId: templateQuery.data.id });
      setIsInWishlist(true);
    }
  };

  if (templateQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground py-12">
        <div className="container">
          <div className="animate-shimmer h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!templateQuery.data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Template not found</p>
          <Button onClick={() => setLocation("/templates")} className="btn-primary">
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  const template = templateQuery.data;
  const galleryImages = template.galleryImages || [];
  const allImages = template.coverImage ? [template.coverImage, ...galleryImages] : galleryImages;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Breadcrumb */}
      <div className="border-b border-border/30 py-4">
        <div className="container">
          <button
            onClick={() => setLocation("/templates")}
            className="text-muted-foreground hover:text-accent transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Templates
          </button>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: Gallery */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            {allImages.length > 0 && (
              <div className="card-cosmic mb-6 overflow-hidden">
                <div className="relative w-full h-96 bg-gradient-cosmic rounded-lg overflow-hidden">
                  <img
                    src={allImages[galleryIndex]}
                    alt={`${template.title} - Image ${galleryIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setGalleryIndex(Math.max(0, galleryIndex - 1))}
                        disabled={galleryIndex === 0}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors disabled:opacity-50"
                      >
                        <ChevronLeft className="w-6 h-6 text-white" />
                      </button>
                      <button
                        onClick={() => setGalleryIndex(Math.min(allImages.length - 1, galleryIndex + 1))}
                        disabled={galleryIndex === allImages.length - 1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors disabled:opacity-50"
                      >
                        <ChevronRight className="w-6 h-6 text-white" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {allImages.map((image, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIndex(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      galleryIndex === i ? "border-accent" : "border-border/30"
                    }`}
                  >
                    <img src={image} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="description" className="mt-12">
              <TabsList className="grid w-full grid-cols-3 bg-card/50">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="card-cosmic mt-6">
                <h3 className="text-xl font-bold mb-4">About This Template</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{template.description}</p>
              </TabsContent>

              <TabsContent value="features" className="card-cosmic mt-6">
                <h3 className="text-xl font-bold mb-4">Features</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-accent">✓</span>
                    <span>Fully customizable HTML & CSS</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">✓</span>
                    <span>Responsive design for all devices</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">✓</span>
                    <span>Easy to integrate with your website</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">✓</span>
                    <span>Smooth animations and transitions</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">✓</span>
                    <span>Cross-browser compatible</span>
                  </li>
                </ul>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6 mt-6">
                {reviewsQuery.data && reviewsQuery.data.length > 0 ? (
                  reviewsQuery.data.map((review) => (
                    <div key={review.id} className="card-cosmic">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? "fill-accent text-accent" : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <h4 className="font-bold">{review.title || "Untitled Review"}</h4>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review!</p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Info & Purchase */}
          <div className="lg:col-span-1">
            {/* Title & Rating */}
            <div className="card-cosmic mb-6">
              <h1 className="text-3xl font-bold mb-4">{template.title}</h1>

              {template.reviewCount && template.reviewCount > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(parseFloat((template.averageRating || 0).toString()))
                            ? "fill-accent text-accent"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {parseFloat(template.averageRating?.toString() || "0").toFixed(1)} ({template.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Price & CTA */}
            <div className="card-cosmic mb-6">
              <div className="text-4xl font-bold text-accent mb-6">
                ${parseFloat(template.price.toString()).toFixed(2)}
              </div>

              <div className="space-y-3 mb-6">
                <Button onClick={handleAddToCart} className="w-full btn-primary" disabled={addToCartMutation.isPending}>
                  <Download className="w-4 h-4 mr-2" />
                  {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                </Button>
                <Button
                  onClick={handleAddToWishlist}
                  variant="outline"
                  className="w-full btn-secondary"
                  disabled={addToWishlistMutation.isPending}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isInWishlist ? "fill-accent text-accent" : ""}`} />
                  {addToWishlistMutation.isPending ? "Adding..." : "Add to Wishlist"}
                </Button>
                <Button variant="outline" className="w-full btn-secondary">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                ✓ Instant download after purchase
              </p>
            </div>

            {/* Related Templates */}
            {relatedQuery.data && relatedQuery.data.length > 0 && (
              <div className="card-cosmic">
                <h3 className="font-bold text-lg mb-4">Related Templates</h3>
                <div className="space-y-3">
                  {relatedQuery.data.map((related) => (
                    <button
                      key={related.id}
                      onClick={() => setLocation(`/template/${related.slug}`)}
                      className="w-full text-left p-3 rounded-lg bg-card/50 hover:bg-card/70 transition-colors group"
                    >
                      <p className="font-semibold group-hover:text-accent transition-colors line-clamp-1">
                        {related.title}
                      </p>
                      <p className="text-sm text-accent">
                        ${parseFloat(related.price.toString()).toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
