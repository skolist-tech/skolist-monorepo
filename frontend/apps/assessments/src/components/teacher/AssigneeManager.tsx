import { Button, Input } from "@skolist/ui";
import { useState, type FormEvent } from "react";
import type { Assignee } from "@/types/assessment";

export function AssigneeManager({
  assignees,
  onAdd,
  onRemove,
}: {
  assignees: Assignee[];
  onAdd: (userId: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const userId = String(data.get("user_id") || "").trim();
    if (!userId) return;
    setBusy(true);
    try {
      await onAdd(userId);
      event.currentTarget.reset();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input name="user_id" placeholder="Student user UUID" required />
        <Button type="submit" disabled={busy}>
          Assign
        </Button>
      </form>
      <ul className="space-y-2 text-sm">
        {assignees.map((assignee) => (
          <li
            key={assignee.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span>{assignee.user_id}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void onRemove(assignee.user_id)}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
