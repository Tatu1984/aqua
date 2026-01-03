"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  CreditCard,
  Truck,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";

type CheckoutStep = "address" | "payment" | "confirmation";

interface AddressForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading, fetchCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>("address");
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [address, setAddress] = useState<AddressForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState<Partial<AddressForm>>({});

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (!isLoading && cart.items.length === 0 && step !== "confirmation") {
      router.push("/cart");
    }
  }, [cart.items.length, isLoading, router, step]);

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
    if (!address.address.trim()) newErrors.address = "Required";
    if (!address.city.trim()) newErrors.city = "Required";
    if (!address.state.trim()) newErrors.state = "Required";
    if (!address.pincode.trim()) newErrors.pincode = "Required";
    else if (!/^\d{6}$/.test(address.pincode))
      newErrors.pincode = "Invalid pincode";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressSubmit = () => {
    if (validateAddress()) {
      setStep("payment");
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setOrderId("ORD" + Date.now().toString().slice(-8));
    setStep("confirmation");
    setProcessing(false);
  };

  const shippingCost = cart.subtotal >= 1000 ? 0 : 99;
  const finalTotal = cart.total + shippingCost;

  // Check for express-only items
  const hasExpressOnlyItems = cart.items.some(
    (item) => item.product.stockStatus === "IN_STOCK"
  );

  if (step === "confirmation") {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>
        <Card className="p-6 text-left mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono font-medium">{orderId}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="font-medium">{formatPrice(finalTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery Address</span>
            <span className="text-right text-sm">
              {address.address}, {address.city}
            </span>
          </div>
        </Card>
        <Button asChild size="lg">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
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
                    Address
                  </label>
                  <Input
                    value={address.address}
                    onChange={(e) =>
                      setAddress({ ...address, address: e.target.value })
                    }
                    className={errors.address ? "border-destructive" : ""}
                    placeholder="House/Flat No., Street, Area"
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.address}
                    </p>
                  )}
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
                    value={address.pincode}
                    onChange={(e) =>
                      setAddress({ ...address, pincode: e.target.value })
                    }
                    className={errors.pincode ? "border-destructive" : ""}
                    placeholder="6-digit pincode"
                  />
                  {errors.pincode && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.pincode}
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
                      {address.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} - {address.pincode}
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
                <div className="border border-primary rounded-lg p-4 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Pay with Razorpay</p>
                      <p className="text-sm text-muted-foreground">
                        UPI, Cards, Netbanking, Wallets
                      </p>
                    </div>
                    <Image
                      src="https://razorpay.com/assets/razorpay-logo.svg"
                      alt="Razorpay"
                      width={100}
                      height={24}
                      className="opacity-70"
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4 opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        Not available for live products
                      </p>
                    </div>
                  </div>
                </div>
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
                  loading={processing}
                  className="flex-1"
                >
                  Pay {formatPrice(finalTotal)}
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
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-14 h-14 rounded bg-secondary flex-shrink-0">
                    <Image
                      src={item.product.image || "https://via.placeholder.com/56"}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded"
                    />
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-1">{item.product.name}</p>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">
                        {item.variant.name}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount</span>
                  <span>-{formatPrice(cart.discount)}</span>
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
              <span>{formatPrice(finalTotal)}</span>
            </div>

            {shippingCost === 0 && (
              <Badge variant="success" className="mt-4 w-full justify-center">
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
  );
}
