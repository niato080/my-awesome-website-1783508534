import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, ShoppingBag, Package, Plus, Edit2, Trash2, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import MarketplaceLayout from "@/components/MarketplaceLayout";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const ordersQuery = trpc.orders.getMyOrders.useQuery();
  const templatesQuery = trpc.templates.search.useQuery({ limit: 100 });

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <MarketplaceLayout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground mb-4">You don't have permission to access this page</p>
          <Button onClick={() => setLocation("/")} className="btn-primary">
            Go Home
          </Button>
        </div>
      </MarketplaceLayout>
    );
  }

  // Calculate metrics
  const totalOrders = ordersQuery.data?.length || 0;
  const totalRevenue = ordersQuery.data?.reduce((sum: number, order: any) => sum + parseFloat(order.total.toString()), 0) || 0;
  const totalTemplates = templatesQuery.data?.templates?.length || 0;
  const totalSold = ordersQuery.data?.reduce((sum: number, order: any) => sum + (order.items?.length || 0), 0) || 0;

  return (
    <MarketplaceLayout>
      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage templates, orders, and users</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="card-cosmic">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold mt-2">{totalOrders}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-accent/30" />
            </div>
          </Card>

          <Card className="card-cosmic">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold mt-2 text-accent">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-accent/30" />
            </div>
          </Card>

          <Card className="card-cosmic">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Templates</p>
                <p className="text-3xl font-bold mt-2">{totalTemplates}</p>
              </div>
              <Package className="w-12 h-12 text-accent/30" />
            </div>
          </Card>

          <Card className="card-cosmic">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Templates Sold</p>
                <p className="text-3xl font-bold mt-2">{totalSold}</p>
              </div>
              <Users className="w-12 h-12 text-accent/30" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 mb-8">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Template Management</h2>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </div>

            {templatesQuery.isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card-cosmic h-20 animate-shimmer" />
                ))}
              </div>
            ) : templatesQuery.data && templatesQuery.data.templates && templatesQuery.data.templates.length > 0 ? (
              <div className="space-y-4">
                {templatesQuery.data.templates.map((template: any) => (
                  <div key={template.id} className="card-cosmic flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{template.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Price: ${parseFloat(template.price.toString()).toFixed(2)} | Views: {template.viewCount || 0}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="btn-secondary">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="btn-secondary">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="btn-secondary">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 card-cosmic">
                <p className="text-muted-foreground">No templates yet</p>
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold">Order Management</h2>

            {ordersQuery.isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card-cosmic h-20 animate-shimmer" />
                ))}
              </div>
            ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
              <div className="space-y-4">
                {ordersQuery.data.map((order: any) => (
                  <div key={order.id} className="card-cosmic">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">Order #{order.id}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.items && order.items.length > 0 ? order.items.length : 0} items | Total: ${parseFloat(order.total.toString()).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Status: <span className={`font-semibold ${order.status === "completed" ? "text-accent" : "text-muted-foreground"}`}>
                            {order.status || "pending"}
                          </span>
                        </p>
                      </div>
                      <Button variant="outline" className="btn-secondary">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 card-cosmic">
                <p className="text-muted-foreground">No orders yet</p>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-cosmic">
                <h3 className="font-bold text-lg mb-4">Revenue Overview</h3>
                <div className="h-64 bg-card/50 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Chart placeholder</p>
                </div>
              </Card>

              <Card className="card-cosmic">
                <h3 className="font-bold text-lg mb-4">Top Templates</h3>
                <div className="space-y-3">
                  {templatesQuery.data?.templates?.slice(0, 5).map((template: any, i: number) => (
                    <div key={template.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                      <div>
                        <p className="font-semibold">{i + 1}. {template.title}</p>
                        <p className="text-xs text-muted-foreground">Views: {template.viewCount || 0}</p>
                      </div>
                      <p className="font-bold text-accent">${parseFloat(template.price.toString()).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MarketplaceLayout>
  );
}
