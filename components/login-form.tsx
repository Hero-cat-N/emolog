import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="grid place-items-center">
          <div className="w-14 h-14 rounded-full flex items-center text-2xl mb-4 justify-center border-2">🎮</div>
          <CardTitle>エモログ</CardTitle>
          <CardDescription>今日のプレイを、3秒で記録する</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">メールアドレス</FieldLabel>
                <Input className="p-4 py-6" id="email" type="email" placeholder="you@example.com" required />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">パスワード</FieldLabel>
                  <a href="#" className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-gray-400">
                    パスワードをお忘れですか？
                  </a>
                </div>
                <Input className="p-4 py-6" id="password" type="password" placeholder="●●●●●●" required />
              </Field>
              <Field>
                <Button className="py-6" type="submit">ログイン</Button>
                <div className="flex items-center gap-2 py-2 w-full">
                  <div className="flex h-px bg-gray-300 flex-1"></div>
                  <span className="flex text-">または</span>
                  <div className="flex h-px bg-gray-300 flex-1"></div>
                </div>
                <Button className="py-6" variant="outline" type="button">
                  Google で ログイン
                </Button>
                <FieldDescription className="text-center">
                  アカウントをお持ちでない方は <a href="#">こちら</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
