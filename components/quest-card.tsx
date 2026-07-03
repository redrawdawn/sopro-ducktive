import { CalendarDays, CheckCircle2, Repeat, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type QuestCardProps = {
  title: string;
  description?: string | null;
  cadence: "daily" | "weekly" | "one_time";
  xpValue: number;
  completed?: boolean;
};

const cadenceLabel = {
  daily: "Daily",
  weekly: "Weekly",
  one_time: "One-Time"
};

export function QuestCard({ title, description, cadence, xpValue, completed }: QuestCardProps) {
  const CadenceIcon = cadence === "daily" ? Repeat : cadence === "weekly" ? CalendarDays : Star;

  return (
    <Card className={completed ? "border-accent/40 bg-accent/10" : ""}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-2xl border border-white/10 bg-muted p-3 text-primary">
          <CadenceIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className={completed ? "font-black text-accent" : "font-black"}>{title}</h3>
              {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
            </div>
            <div className="text-right">
              <div className="font-black text-secondary">+{xpValue}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-black/40">
              <div className={completed ? "h-1.5 w-full rounded-full bg-accent" : "h-1.5 w-2/3 rounded-full bg-secondary"} />
            </div>
            <Badge variant="outline" className="border-white/10 text-[10px]">
              {completed ? <CheckCircle2 className="mr-1 h-3 w-3" /> : null}
              {cadenceLabel[cadence]}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
