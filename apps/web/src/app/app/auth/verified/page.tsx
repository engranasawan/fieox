"use client";

import Link from "next/link";
import { Shell } from "@/components/ui/Shell";
import { Button, Card } from "@/components/ui/primitives";

export default function VerifiedPage() {
  return (
    <Shell title="Email verified ✅" subtitle="Your account is ready. Head back to login to continue.">
      <Card className="p-6">
        <p className="text-white/70">
          Your email was successfully verified. You can now sign in.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/login">
            <Button type="button">Go to Login</Button>
          </Link>
          <Link href="/">
            <Button type="button" variant="secondary">Home</Button>
          </Link>
        </div>
      </Card>
    </Shell>
  );
}
