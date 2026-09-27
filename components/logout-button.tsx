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
    // ページヘッダー右上のアイコンボタン（34×34 / radius 10 / cream-100 背景）
    <Button
      variant="secondary"
      size="icon"
      aria-label="ログアウト"
      title="ログアウト"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="size-8.5 rounded-[10px] text-ink-soft"
    >
      <LogOut className="size-4" strokeWidth={1.8} />
    </Button>
  );
}
