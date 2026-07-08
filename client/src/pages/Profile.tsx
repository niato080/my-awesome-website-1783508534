import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Heart, LogOut, User, ShoppingBag } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const ordersQuery = trpc.orders.getMyOrders.useQuery();
  const wishlistQuery = trpc.wishlist.getItems.useQuery();
  // Downloads are fetched from orders with completed status

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view your profile</p>
          <Button onClick={() => setLocation("/")} className="btn-primary">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/30 py-12 bg-card/30">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user.name || "User"}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" className="btn-secondary">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 mb-8">
            <TabsTrigger value="orders">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="downloads">
              <Download className="w-4 h-4 mr-2" />
              Downloads
            </TabsTrigger>
            <TabsTrigger value="wishlist">
              <Heart className="w-4 h-4 mr-2" />
              Wishlist
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold">Purchase History</h2>
            {ordersQuery.isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card-cosmic h-24 animate-shimmer" />
                ))}
              </div>
            ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
              <div className="space-y-4">
                {ordersQuery.data.map((order) => (
                  <div key={order.id} className="card-cosmic">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                        <p className="font-bold text-lg mt-1">
                          {order.items && order.items.length > 0 ? order.items.length : 0} template{order.items && order.items.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-accent">
                          ${parseFloat(order.total.toString()).toFixed(2)}
                        </p>
                        <p className={`text-sm mt-2 font-semibold ${
                          order.status === "completed" ? "text-accent" : "text-muted-foreground"
                        }`}>
                          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Pending"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 card-cosmic">
                <ShoppingBag className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No orders yet</p>
                <Button onClick={() => setLocation("/templates")} className="btn-primary">
                  Browse Templates
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Downloads Tab */}
          <TabsContent value="downloads" className="space-y-6">
            <h2 className="text-2xl font-bold">Your Downloads</h2>
            {ordersQuery.isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card-cosmic h-24 animate-shimmer" />
                ))}
              </div>
            ) : ordersQuery.data && ordersQuery.data.some(o => o.status === "completed" && o.items) ? (
              <div className="space-y-4">
                {ordersQuery.data
                  .filter(o => o.status === "completed" && o.items && o.items.length > 0)
                  .flatMap(o => o.items || [])
                  .map((item) => (
                    <div key={item.id} className="card-cosmic">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-lg">{item.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Purchased: {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button className="btn-primary">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 card-cosmic">
                <Download className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No downloads available</p>
                <Button onClick={() => setLocation("/templates")} className="btn-primary">
                  Purchase Templates
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist" className="space-y-6">
            <h2 className="text-2xl font-bold">Wishlist</h2>
            {wishlistQuery.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card-cosmic h-64 animate-shimmer" />
                ))}
              </div>
            ) : wishlistQuery.data && wishlistQuery.data.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistQuery.data.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLocation(`/template/${item.template?.slug}`)}
                    className="card-cosmic text-left group"
                  >
                    {item.template?.coverImage && (
                      <div className="w-full h-40 bg-gradient-cosmic rounded-lg mb-4 overflow-hidden">
                        <img
                          src={item.template.coverImage}
                          alt={item.template.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <h3 className="font-bold text-lg line-clamp-2 group-hover:text-accent transition-colors">
                      {item.template?.title}
                    </h3>
                    <p className="text-accent text-lg mt-2 font-bold">
                      ${parseFloat((item.template?.price || "0").toString()).toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 card-cosmic">
                <Heart className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
                <Button onClick={() => setLocation("/templates")} className="btn-primary">
                  Explore Templates
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
