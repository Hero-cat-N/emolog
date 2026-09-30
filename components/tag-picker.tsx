"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

// 記録フォームのタグ選択。既存タグをタップで選択/解除し、「＋追加」で新しいタグ名を入力できる。
// 新しいタグはここでは value（選択中の配列）に足すだけ。DBに作るのは保存時のサーバー側
export function TagPicker({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: string[];
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  // 表示するチップ = 今までのタグ + まだDBに無い新しいタグ（選択中のもの）
  const chips = [...new Set([...options, ...value])];

  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name]);

  const commitDraft = () => {
    const name = draft.trim();
    if (name && !value.includes(name)) onChange([...value, name]);
    setDraft("");
    setAdding(false);
  };

  const chip = "rounded-full px-3 py-1.5 text-xs transition-colors duration-150";

  return (
    <div className="flex flex-wrap gap-1.75">
      {chips.map((name) => {
        const selected = value.includes(name);
        return (
          <button
            key={name}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(name)}
            className={cn(
              chip,
              // 選択中はダーク反転、未選択は outline（design.md 7節）
              selected
                ? "bg-foreground font-bold text-background"
                : "border bg-card text-ink-soft hover:bg-accent",
            )}
          >
            {name}
          </button>
        );
      })}

      {adding ? (
        <input
          autoFocus
          value={draft}
          maxLength={20}
          placeholder="タグ名"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            // Enter でフォームごと送信されないように止めて、タグの追加だけ行う
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
            if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          className="w-28 rounded-full border border-brand bg-card px-3 py-1.5 text-xs outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={cn(chip, "border border-dashed border-[#D8CDBD] bg-card text-muted-foreground hover:bg-accent")}
        >
          ＋追加
        </button>
      )}
    </div>
  );
}
