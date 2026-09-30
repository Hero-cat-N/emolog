import { LoginForm } from "@/components/login-form"

// SP は上から縦積み、md 以上は画面中央にカードを置く（ナビなし）
export default function Page() {
  return (
    <div className="flex min-h-svh w-full justify-center bg-background md:items-center md:p-10">
      <LoginForm />
    </div>
  )
}
