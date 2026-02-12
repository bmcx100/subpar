"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Subpar</h1>
          <p className="text-muted-foreground">
            Golf speed & strength training
          </p>
        </div>
        <Button
          className="w-full"
          size="lg"
          onClick={() => signIn("credentials", { callbackUrl: "/" })}
        >
          Enter
        </Button>
      </div>
    </div>
  );
}
