import { QuestCard } from "@/components/quest-card";

const quests = [
  { title: "Exercise", description: "Move for at least 20 minutes.", cadence: "daily" as const, xpValue: 30 },
  { title: "Take Out Trash", description: "Clear household trash and reset bins.", cadence: "weekly" as const, xpValue: 35 },
  { title: "Deep Clean Pantry", description: "One-time reset quest.", cadence: "one_time" as const, xpValue: 90 }
];

export default function QuestsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-black">Quest Log</h1>
        <p className="mt-2 text-muted-foreground">Create, edit, complete, and retire real-world tasks.</p>
      </div>
      <div className="space-y-3">
        {quests.map((quest) => (
          <QuestCard key={quest.title} {...quest} />
        ))}
      </div>
    </div>
  );
}
