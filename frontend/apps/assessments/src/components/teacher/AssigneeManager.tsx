import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
} from "@skolist/ui";
import { useEffect, useMemo, useState } from "react";
import { listOrgStudents } from "@/services/tests";
import type { Assignee, OrgStudent } from "@/types/assessment";

function displayName(person: {
  name?: string | null;
  email?: string | null;
  id?: string;
}) {
  return person.name?.trim() || person.email || person.id || "Student";
}

function initials(person: { name?: string | null; email?: string | null }) {
  const name = person.name?.trim();
  if (name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  const email = person.email?.trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

function PersonAvatar({
  person,
}: {
  person: {
    name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
}) {
  const label = displayName(person);
  return (
    <Avatar className="h-8 w-8">
      {person.avatar_url ? (
        <AvatarImage src={person.avatar_url} alt={label} />
      ) : null}
      <AvatarFallback className="text-xs">{initials(person)}</AvatarFallback>
    </Avatar>
  );
}

function matchesQuery(student: OrgStudent, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const name = (student.name || "").toLowerCase();
  const email = (student.email || "").toLowerCase();
  return name.includes(needle) || email.includes(needle);
}

export function AssigneeManager({
  assignees,
  onAdd,
  onRemove,
}: {
  assignees: Assignee[];
  onAdd: (userId: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const [students, setStudents] = useState<OrgStudent[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listOrgStudents()
      .then(setStudents)
      .catch((err: Error) => setError(err.message));
  }, []);

  const assignedIds = useMemo(
    () => new Set(assignees.map((assignee) => assignee.user_id)),
    [assignees]
  );

  const suggestions = useMemo(
    () =>
      students.filter(
        (student) =>
          !assignedIds.has(student.id) && matchesQuery(student, query)
      ),
    [assignedIds, query, students]
  );

  async function assignStudent(userId: string) {
    setBusy(true);
    setError(null);
    try {
      await onAdd(userId);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign student");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Search students"
          aria-label="Search students"
          autoComplete="off"
          disabled={busy}
        />
        {open ? (
          <ul
            className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-background shadow-sm"
            role="listbox"
            aria-label="Search students"
          >
            {suggestions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                No matching students
              </li>
            ) : (
              suggestions.map((student) => (
                <li key={student.id} role="option">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
                    disabled={busy}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void assignStudent(student.id)}
                  >
                    <PersonAvatar person={student} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {displayName(student)}
                      </span>
                      {student.email ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {student.email}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <ul className="space-y-2 text-sm">
        {assignees.map((assignee) => (
          <li
            key={assignee.id}
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
          >
            <span className="flex min-w-0 items-center gap-3">
              <PersonAvatar person={assignee} />
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {displayName({
                    name: assignee.name,
                    email: assignee.email,
                    id: assignee.user_id,
                  })}
                </span>
                {assignee.email ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {assignee.email}
                  </span>
                ) : null}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
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
