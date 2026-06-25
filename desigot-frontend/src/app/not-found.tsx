import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-brand/10 mb-4">404</div>
        <h1 className="text-2xl font-bold text-ink-primary mb-2">Page not found</h1>
        <p className="text-ink-secondary text-sm mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/"><Button variant="primary">Go Home</Button></Link>
          <Link href="/browse"><Button variant="secondary">Browse Marketplace</Button></Link>
        </div>
      </div>
    </div>
  );
}
