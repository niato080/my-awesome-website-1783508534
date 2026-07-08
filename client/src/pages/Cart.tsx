import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ArrowLeft, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const cartQuery = trpc.cart.getItems.useQuery(undefined, { enabled: isAuthenticated });
  const removeItemMutation = trpc.cart.removeItem.useMutation();
  const [couponLoading, setCouponLoading] = useState(false);
  const createOrderMutation = trpc.orders.create.useMutation();

  const cartItems = cartQuery.data || [];

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + parseFloat((item.template?.price || "0").toString()), 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === "percentage") {
      return (subtotal * parseFloat(appliedCoupon.discountValue.toString())) / 100;
    } else {
      return parseFloat(appliedCoupon.discountValue.toString());
    }
  }, [appliedCoupon, subtotal]);

  const total = subtotal - discountAmount;

  const handleRemoveItem = async (templateId: number) => {
    await removeItemMutation.mutateAsync({ templateId });
    await cartQuery.refetch();
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const result = await trpc.coupons.validate.useQuery({
        code: couponCode,
        orderTotal: subtotal.toString(),
      }).refetch();
      if (result.data?.valid && result.data.coupon) {
        setAppliedCoupon(result.data.coupon);
      }
    } catch (error) {
      console.error("Coupon validation failed", error);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }

    try {
      const order = await createOrderMutation.mutateAsync({
        items: cartItems.map((item) => ({
          templateId: item.templateId,
          title: item.template?.title || "Unknown",
          price: (item.template?.price || "0").toString(),
        })),
        couponCode: appliedCoupon?.code,
        discountAmount: discountAmount.toString(),
        subtotal: subtotal.toString(),
        total: total.toString(),
      });

      // Navigate to checkout with order ID
      setLocation(`/checkout/${order.orderId}`);
    } catch (error) {
      console.error("Order creation failed", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view your cart</p>
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
      <div className="border-b border-border/30 py-6">
        <div className="container">
          <button
            onClick={() => setLocation("/templates")}
            className="text-muted-foreground hover:text-accent transition-colors flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </button>
          <h1 className="text-4xl font-bold">Shopping Cart</h1>
        </div>
      </div>

      <div className="container py-12">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-6">Your cart is empty</p>
            <Button onClick={() => setLocation("/templates")} className="btn-primary">
              Browse Templates
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="card-cosmic flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{item.template?.title || "Unknown Template"}</h3>
                      <p className="text-accent text-lg mt-2">
                        ${parseFloat((item.template?.price || "0").toString()).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removeItemMutation.isPending}
                      className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card-cosmic space-y-6 sticky top-6">
                <h2 className="text-2xl font-bold">Order Summary</h2>

                {/* Coupon Input */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">Coupon Code</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon}
                      className="flex-1 bg-input border-border/50"
                    />
                    {!appliedCoupon ? (
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="btn-primary"
                      >
                        Apply
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                        }}
                        variant="outline"
                        className="btn-secondary"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="text-sm text-accent mt-2">✓ Coupon applied: {appliedCoupon.code}</p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 border-t border-border/30 pt-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex justify-between text-accent">
                      <span>Discount</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-border/30 pt-3">
                    <span>Total</span>
                    <span className="text-accent">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={createOrderMutation.isPending}
                  className="w-full btn-primary"
                >
                  {createOrderMutation.isPending ? "Processing..." : "Proceed to Checkout"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  ✓ Secure payment powered by Stripe
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
