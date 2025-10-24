import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-7xl font-semibold text-black">DjangoLLM</h1>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="border border-black/40">
              Register
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
