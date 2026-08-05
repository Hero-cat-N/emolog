import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function Post() {
  return (
    <div className="max-w-7xl px-4 py-8">
      <h2 className="text-2xl">今日の記録</h2>
      <form>
        <div className="grid gap-8 mb-4">
          <div className="flex flex-col gap-4">
            <Label htmlFor="today">今日やったこと</Label>
            <Input id="today" type="text" placeholder="今日" required />
          </div>
          <div className="flex flex-col gap-4">
            <Label htmlFor="today">今日やったこと</Label>
            <Input id="today" type="text" placeholder="今日" required />
          </div>
          <div className="flex flex-col gap-4">
            <Label htmlFor="today">今日やったこと</Label>
            <Input id="today" type="text" placeholder="今日" required />
          </div>
        </div>
        <Separator />
        <h3>今日の気分</h3>
        <ToggleGroup size="sm" defaultValue={["normal"]} variant="outline" spacing={2}>
          <ToggleGroupItem value="fun" aria-label="Toggle fun">
            😄楽しい
          </ToggleGroupItem>
          <ToggleGroupItem value="normal" aria-label="Toggle normal">
            😐普通
          </ToggleGroupItem>
          <ToggleGroupItem value="sad" aria-label="Toggle sad">
            😞悲しい
          </ToggleGroupItem>
          <ToggleGroupItem value="frustrate" aria-label="Toggle frustrate">
            😤モヤモヤ
          </ToggleGroupItem>
        </ToggleGroup>
      </form>
    </div>
  );
}
