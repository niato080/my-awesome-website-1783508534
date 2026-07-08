import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Checkout() {
  const [match, params] = useRoute("/checkout/:orderId");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "success" | "error">("pending");

  if (!match || !isAuthenticated) {
    return null;
  }

  const orderId = parseInt(params?.orderId as string);
  const ordersQuery = trpc.orders.getMyOrders.useQuery();
  const updateOrderMutation = trpc.orders.updateStatus.useMutation();

  const order = ordersQuery.data?.find((o) => o.id === orderId);

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // TODO: Integrate Stripe payment here
      // For now, we'll simulate a successful payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update order status to completed
      await updateOrderMutation.mutateAsync({
        orderId,
        status: "completed",
        stripePaymentIntentId: "pi_mock_" + Date.now(),
      });

      setPaymentStatus("success");
    } catch (error) {
      console.error("Payment failed", error);
      setPaymentStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (ordersQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Button onClick={() => setLocation("/templates")} className="btn-primary">
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container max-w-2xl">
        {paymentStatus === "success" ? (
          <div className="card-cosmic text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-accent mx-auto" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Your order has been confirmed and your templates are ready to download.
              </p>
            </div>

            <div className="bg-card/50 rounded-lg p-6 text-left space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-bold text-lg">#{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-bold text-lg text-accent">
                  ${parseFloat(order.total.toString()).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-bold text-lg text-accent">Completed</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={() => setLocation("/profile/downloads")} className="w-full btn-primary">
                Download Your Templates
              </Button>
              <Button onClick={() => setLocation("/templates")} variant="outline" className="w-full btn-secondary">
                Continue Shopping
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        ) : paymentStatus === "error" ? (
          <div className="card-cosmic text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
              <p className="text-muted-foreground">
                There was an issue processing your payment. Please try again.
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={handlePayment} disabled={isProcessing} className="w-full btn-primary">
                {isProcessing ? "Processing..." : "Try Again"}
              </Button>
              <Button onClick={() => setLocation("/cart")} variant="outline" className="w-full btn-secondary">
                Back to Cart
              </Button>
            </div>
          </div>
        ) : (
          <div className="card-cosmic space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order Summary</h1>
              <p className="text-muted-foreground">Review your order before completing payment</p>
            </div>

            {/* Order Items */}
            <div className="space-y-4 border-t border-border/30 pt-6">
              <h2 className="font-bold text-lg">Items</h2>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-card/50 rounded-lg">
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">Template</p>
                      </div>
                      <p className="font-bold text-accent">
                        ${parseFloat(item.price.toString()).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No items in this order</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 border-t border-border/30 pt-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${parseFloat(order.subtotal.toString()).toFixed(2)}</span>
              </div>
              {order.discountAmount && parseFloat(order.discountAmount.toString()) > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Discount</span>
                  <span>-${parseFloat(order.discountAmount.toString()).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-border/30 pt-3">
                <span>Total</span>
                <span className="text-accent">${parseFloat(order.total.toString()).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4 border-t border-border/30 pt-6">
              <h2 className="font-bold text-lg">Payment Method</h2>
              <div className="p-4 bg-card/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Secure payment powered by</p>
                <p className="font-bold text-lg">Stripe</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Your payment information is encrypted and secure. We never store your credit card details.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 border-t border-border/30 pt-6">
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full btn-primary text-lg py-6"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Complete Payment - ${parseFloat(order.total.toString()).toFixed(2)}</>
                )}
              </Button>
              <Button onClick={() => setLocation("/cart")} variant="outline" className="w-full btn-secondary">
                Back to Cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
