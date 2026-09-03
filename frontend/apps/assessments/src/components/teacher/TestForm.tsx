import { Button, Input, Label, Textarea } from "@skolist/ui";
import type { FormEvent } from "react";

export function TestForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (payload: {
    name: string;
    description: string;
    exam_type: string;
    duration_minutes: number;
  }) => void;
  submitting?: boolean;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      name: String(data.get("name") || ""),
      description: String(data.get("description") || ""),
      exam_type: String(data.get("exam_type") || "jee_main"),
      duration_minutes: Number(data.get("duration_minutes") || 180),
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="exam_type">Exam type</Label>
          <select
            id="exam_type"
            name="exam_type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue="jee_main"
          >
            <option value="jee_main">JEE Main</option>
            <option value="jee_advanced">JEE Advanced</option>
            <option value="neet">NEET</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min={1}
            defaultValue={180}
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create draft"}
      </Button>
    </form>
  );
}
