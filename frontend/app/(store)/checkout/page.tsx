"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  CreditCard,
  Truck,
  Check,
  AlertCircle,
  Loader2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

type CheckoutStep = "address" | "payment" | "confirmation";
type PaymentMethod = "RAZORPAY" | "COD";

interface AddressForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
}

interface OrderResult {
  id: string;
  orderNumber: string;
  total: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<CheckoutStep>("address");
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("RAZORPAY");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const [address, setAddress] = useState<AddressForm>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const [errors, setErrors] = useState<Partial<AddressForm>>({});

  useEffect(() => {
    if (items.length === 0 && step !== "confirmation") {
      router.push("/cart");
    }
  }, [items.length, router, step]);

  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = subtotal >= 1000 ? 0 : 99;
  const discount = couponDiscount;
  const total = subtotal - discount + shippingCost;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);

  const validateAddress = () => {
    const newErrors: Partial<AddressForm> = {};
    if (!address.firstName.trim()) newErrors.firstName = "Required";
    if (!address.lastName.trim()) newErrors.lastName = "Required";
    if (!address.email.trim()) newErrors.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(address.email))
      newErrors.email = "Invalid email";
    if (!address.phone.trim()) newErrors.phone = "Required";
    else if (!/^\d{10}$/.test(address.phone))
      newErrors.phone = "Invalid phone number";
    if (!address.addressLine1.trim()) newErrors.addressLine1 = "Required";
    if (!address.city.trim()) newErrors.city = "Required";
    if (!address.state.trim()) newErrors.state = "Required";
    if (!address.postalCode.trim()) newErrors.postalCode = "Required";
    else if (!/^\d{6}$/.test(address.postalCode))
      newErrors.postalCode = "Invalid pincode";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressSubmit = () => {
    if (validateAddress()) {
      setStep("payment");
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");

    try {
      const res = await fetch(`${API_URL}/api/cart/coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: couponCode }),
      });

      if (!res.ok) {
        const error = await res.json();
        setCouponError(error.error || "Invalid coupon");
        return;
      }

      const data = await res.json();
      setCouponDiscount(data.coupon.discount);
      setAppliedCoupon(couponCode);
    } catch {
      setCouponError("Failed to apply coupon");
    }
  };

  const removeCoupon = () => {
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Create order
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          sku: item.sku || `SKU-${item.productId}`,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        email: address.email,
        phone: address.phone,
        shippingAddress: {
          firstName: address.firstName,
          lastName: address.lastName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
        },
        paymentMethod,
        couponCode: appliedCoupon,
        subtotal,
        discount,
        shippingCost,
        tax: 0,
        total,
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        throw new Error("Failed to create order");
      }

      const { order: createdOrder } = await res.json();

      // For COD, just show confirmation
      if (paymentMethod === "COD") {
        setOrder({
          id: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          total: createdOrder.total,
        });
        clearCart();
        setStep("confirmation");
        return;
      }

      // For Razorpay, create payment order and open checkout
      const paymentRes = await fetch(`${API_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: total,
          receipt: createdOrder.orderNumber,
          notes: { orderId: createdOrder.id },
        }),
      });

      if (!paymentRes.ok) {
        throw new Error("Failed to create payment order");
      }

      const paymentData = await paymentRes.json();

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "Aqua Store",
        description: `Order ${createdOrder.orderNumber}`,
        order_id: paymentData.orderId,
        handler: async (response: RazorpayResponse) => {
          // Verify payment
          const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              ...response,
              orderId: createdOrder.id,
            }),
          });

          if (verifyRes.ok) {
            setOrder({
              id: createdOrder.id,
              orderNumber: createdOrder.orderNumber,
              total: createdOrder.total,
            });
            clearCart();
            setStep("confirmation");
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: `${address.firstName} ${address.lastName}`,
          email: address.email,
          contact: address.phone,
        },
        theme: { color: "#0EA5E9" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to process order. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (step === "confirmation" && order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for your order. We&apos;ll send you a confirmation email shortly.
        </p>
        <Card className="p-6 text-left mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono font-medium">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="font-medium">{formatPrice(order.total)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-medium">
              {paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery Address</span>
            <span className="text-right text-sm">
              {address.addressLine1}, {address.city}
            </span>
          </div>
        </Card>
        <div className="flex gap-4">
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link href="/account/orders">View Orders</Link>
          </Button>
          <Button asChild size="lg" className="flex-1">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="container mx-auto px-4 py-8">
        <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div
          className={`flex items-center gap-2 ${
            step === "address" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === "address"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <MapPin className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline font-medium">Address</span>
        </div>
        <div className="w-12 h-0.5 bg-muted" />
        <div
          className={`flex items-center gap-2 ${
            step === "payment" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === "payment"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline font-medium">Payment</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          {step === "address" && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name
                  </label>
                  <Input
                    value={address.firstName}
                    onChange={(e) =>
                      setAddress({ ...address, firstName: e.target.value })
                    }
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <Input
                    value={address.lastName}
                    onChange={(e) =>
                      setAddress({ ...address, lastName: e.target.value })
                    }
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={address.email}
                    onChange={(e) =>
                      setAddress({ ...address, email: e.target.value })
                    }
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <Input
                    type="tel"
                    value={address.phone}
                    onChange={(e) =>
                      setAddress({ ...address, phone: e.target.value })
                    }
                    className={errors.phone ? "border-destructive" : ""}
                    placeholder="10-digit mobile number"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Address Line 1
                  </label>
                  <Input
                    value={address.addressLine1}
                    onChange={(e) =>
                      setAddress({ ...address, addressLine1: e.target.value })
                    }
                    className={errors.addressLine1 ? "border-destructive" : ""}
                    placeholder="House/Flat No., Street, Area"
                  />
                  {errors.addressLine1 && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.addressLine1}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <Input
                    value={address.addressLine2}
                    onChange={(e) =>
                      setAddress({ ...address, addressLine2: e.target.value })
                    }
                    placeholder="Landmark, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <Input
                    value={address.city}
                    onChange={(e) =>
                      setAddress({ ...address, city: e.target.value })
                    }
                    className={errors.city ? "border-destructive" : ""}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.city}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <Input
                    value={address.state}
                    onChange={(e) =>
                      setAddress({ ...address, state: e.target.value })
                    }
                    className={errors.state ? "border-destructive" : ""}
                  />
                  {errors.state && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.state}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Pincode
                  </label>
                  <Input
                    value={address.postalCode}
                    onChange={(e) =>
                      setAddress({ ...address, postalCode: e.target.value })
                    }
                    className={errors.postalCode ? "border-destructive" : ""}
                    placeholder="6-digit pincode"
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.postalCode}
                    </p>
                  )}
                </div>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handleAddressSubmit}
              >
                Continue to Payment
              </Button>
            </Card>
          )}

          {step === "payment" && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Payment</h2>

              {/* Address Summary */}
              <div className="bg-secondary/50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.addressLine1}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} - {address.postalCode}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.phone}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("address")}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-4">
                <button
                  onClick={() => setPaymentMethod("RAZORPAY")}
                  className={`w-full border rounded-lg p-4 text-left transition-colors ${
                    paymentMethod === "RAZORPAY"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === "RAZORPAY"
                          ? "border-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {paymentMethod === "RAZORPAY" && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Pay Online</p>
                      <p className="text-sm text-muted-foreground">
                        UPI, Cards, Netbanking, Wallets
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod("COD")}
                  className={`w-full border rounded-lg p-4 text-left transition-colors ${
                    paymentMethod === "COD"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === "COD"
                          ? "border-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {paymentMethod === "COD" && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        Pay when your order arrives
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep("address")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={handlePayment}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {paymentMethod === "COD" ? "Place Order" : `Pay ${formatPrice(total)}`}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-32 h-fit">
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-14 h-14 rounded bg-secondary flex-shrink-0">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    )}
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-1">{item.name}</p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Coupon Code */}
            <div className="mb-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-500/10 text-green-600 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span className="font-medium">{appliedCoupon}</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={applyCoupon}>
                    Apply
                  </Button>
                </div>
              )}
              {couponError && (
                <p className="text-sm text-destructive mt-1">{couponError}</p>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {shippingCost === 0 ? (
                    <span className="text-green-500">FREE</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            {shippingCost === 0 && (
              <Badge variant="outline" className="mt-4 w-full justify-center text-green-500 border-green-500">
                <Truck className="h-3 w-3 mr-1" />
                Free shipping applied!
              </Badge>
            )}
          </Card>

          {/* Info Cards */}
          <Card className="p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Live Stock Delivery</p>
                <p className="text-muted-foreground">
                  Express shipping for all live products. Delivery within 24-48
                  hours.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
