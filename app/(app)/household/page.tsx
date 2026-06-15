import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HouseholdPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-black">Household</h1>
        <p className="mt-2 text-muted-foreground">Invite a partner now, with room for families and groups later.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Shared Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            The Version 1 database supports household ownership, member roles, invites, shared quests, and household-wide progress summaries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
