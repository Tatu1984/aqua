import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Aqua Backend</h1>
        <p className="text-muted-foreground mb-8">API Server & Admin Panel</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/admin"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Admin Panel
          </Link>
          <Link
            href="/api"
            className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
          >
            API Docs
          </Link>
        </div>
      </div>
    </div>
  );
}
