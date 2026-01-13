import { useState, useRef, useEffect } from "react";
import { Input, Label } from "@skolist/ui";
import { cn } from "@skolist/utils";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import { useConceptContext } from "../../../../context/ConceptContext";

interface ClassSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ClassSelector({ value, onChange }: ClassSelectorProps) {
  const { schoolClasses, isLoadingSchoolClasses, selectSchoolClass } =
    useConceptContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (classId: string) => {
    selectSchoolClass(classId);
    onChange(classId);
    setIsOpen(false);
    setSearchQuery("");
  };

  const selectedClass = schoolClasses.find((cls) => cls.id === value);

  const filteredClasses = schoolClasses.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="space-y-2">
      <Label>Class</Label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !isLoadingSchoolClasses && setIsOpen(!isOpen)}
          disabled={isLoadingSchoolClasses}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2",
            "text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span className={cn(!selectedClass && "text-muted-foreground")}>
            {isLoadingSchoolClasses ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading classes...
              </span>
            ) : selectedClass ? (
              selectedClass.name
            ) : (
              "Select class"
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
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredClasses.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No results found
                </div>
              ) : (
                filteredClasses.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => handleChange(cls.id)}
                    className={cn(
                      "flex w-full items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                      value === cls.id && "bg-accent text-accent-foreground"
                    )}
                  >
                    {cls.name}
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
