import { QuestCard } from "@/components/quest-card";

const quests = [
  { title: "Exercise", description: "Move for at least 20 minutes.", cadence: "daily" as const, xpValue: 30 },
  { title: "Take Out Trash", description: "Reset bins.", cadence: "weekly" as const, xpValue: 35 },
  { title: "Deep Clean Pantry", description: "One-time reset quest.", cadence: "one_time" as const, xpValue: 90 }
];

export default function QuestsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-black">Daily</h1>
      </div>
      <div className="space-y-3">
        {quests.map((quest) => (
          <QuestCard key={quest.title} {...quest} />
        ))}
      </div>
    </div>
  );
}
