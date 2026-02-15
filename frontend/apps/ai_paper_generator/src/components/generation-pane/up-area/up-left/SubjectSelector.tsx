import React, { useState, useRef, useEffect } from "react";
import { Input, Label } from "@skolist/ui";
import { cn } from "@skolist/utils";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import { useConceptContext } from "../../../../context/ConceptContext";

interface SubjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  classId?: string;
  disabled?: boolean;
}

export function SubjectSelector({
  value,
  onChange,
  classId,
  disabled,
}: SubjectSelectorProps) {
  const { subjects, isLoadingSubjects, selectSubject } = useConceptContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isDisabled = disabled || !classId || isLoadingSubjects;

  const handleChange = (subjectId: string) => {
    selectSubject(subjectId);
    onChange(subjectId);
    setIsOpen(false);
    setSearchQuery("");
  };

  const selectedSubject = subjects.find((subject) => subject.id === value);

  const filteredSubjects = React.useMemo(
    () =>
      subjects.filter((subject) =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [subjects, searchQuery]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input and reset highlight when dropdown opens
  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      const selectedIndex = filteredSubjects.findIndex((s) => s.id === value);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, filteredSubjects, value]);

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if ((e.key === "ArrowDown" || e.key === "Enter") && !isDisabled) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSubjects.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSubjects[highlightedIndex]) {
        handleChange(filteredSubjects[highlightedIndex].id);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const getPlaceholderText = () => {
    if (!classId) return "Select class first";
    if (isLoadingSubjects) return "Loading subjects...";
    if (subjects.length === 0) return "No subjects available";
    return "Select subject";
  };

  return (
    <div className="space-y-2">
      <Label>Subject</Label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !isDisabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2",
            "text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span className={cn(!selectedSubject && "text-muted-foreground")}>
            {isLoadingSubjects ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading subjects...
              </span>
            ) : selectedSubject ? (
              selectedSubject.name
            ) : (
              getPlaceholderText()
            )}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-background shadow-lg">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 pl-8"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto" ref={listRef}>
              {filteredSubjects.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No results found
                </div>
              ) : (
                filteredSubjects.map((subject, index) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => handleChange(subject.id)}
                    className={cn(
                      "flex w-full items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                      index === highlightedIndex &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    {subject.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
