import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardWidgetProps = {
  title: string;
  value: string;
  detail?: string;
};

export function DashboardWidget({ title, value, detail }: DashboardWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black">{value}</div>
        {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}
