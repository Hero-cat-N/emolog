"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    // proxy.ts が未ログインを検知して /login に飛ばしてくれるので、
    // ここでは router.refresh() でサーバー側の状態を再取得させるだけでよい
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="ログアウト"
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      <LogOut />
    </Button>
  );
}
