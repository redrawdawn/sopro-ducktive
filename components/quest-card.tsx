import { CalendarDays, CheckCircle2, Repeat, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="mt-1 rounded-md bg-muted p-2 text-primary">
          <CadenceIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold">{title}</h3>
              {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
            </div>
            <Badge variant="secondary">{xpValue} XP</Badge>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Badge variant="outline">{cadenceLabel[cadence]}</Badge>
            <Button variant={completed ? "secondary" : "default"} size="sm">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {completed ? "Done" : "Complete"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
