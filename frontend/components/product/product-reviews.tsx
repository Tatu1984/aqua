"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  isVerified: boolean;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
  };
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
  averageRating: number;
  totalReviews: number;
}

export function ProductReviews({
  productId,
  productName,
  averageRating,
  totalReviews,
}: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`${API_URL}/api/reviews?productId=${productId}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [productId]);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || null,
          content: content.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReviews([data.review, ...reviews]);
        setShowForm(false);
        setRating(5);
        setTitle("");
        setContent("");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return (f + l).toUpperCase() || "A";
  };

  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingCounts[r.rating - 1]++;
    }
  });

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Summary */}
        <Card className="p-6">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
            </p>

            {/* Rating bars */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingCounts[stars - 1];
                const percentage =
                  totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-3">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            {user && !showForm && (
              <Button className="w-full mt-6" onClick={() => setShowForm(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            )}

            {!user && (
              <p className="text-sm text-muted-foreground mt-4">
                Please sign in to write a review
              </p>
            )}
          </div>
        </Card>

        {/* Review Form or List */}
        <div className="md:col-span-2">
          {showForm && (
            <Card className="p-6 mb-6">
              <h3 className="font-bold mb-4">Write Your Review</h3>

              {/* Star Rating Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i + 1)}
                      onMouseEnter={() => setHoverRating(i + 1)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          i < (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Review Title (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="Summarize your experience"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Your Review
                </label>
                <Textarea
                  placeholder={`What did you think about ${productName}?`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Review
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Reviews List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reviews yet. Be the first to review this product!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(review.user.firstName, review.user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {review.user.firstName || "Anonymous"}
                          {review.user.lastName && ` ${review.user.lastName}`}
                        </span>
                        {review.isVerified && (
                          <Badge variant="outline" className="text-xs">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="font-medium mb-1">{review.title}</h4>
                      )}
                      {review.content && (
                        <p className="text-muted-foreground">{review.content}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
