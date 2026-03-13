import { useState } from "react";
import { Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from "@skolist/ui";

interface OnlineTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  error: string | null;
  shareCode: string | null;
  shareUrl: string | null;
  testTitle: string | null;
  alreadyExists: boolean;
  onCreateTest: () => void;
}

export function OnlineTestDialog({
  open,
  onOpenChange,
  isLoading,
  error,
  shareCode,
  shareUrl,
  testTitle,
  alreadyExists,
  onCreateTest,
}: OnlineTestDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenInNewTab = () => {
    if (!shareUrl) return;
    window.open(shareUrl, "_blank");
  };

  // Initial state - show confirmation
  if (!shareCode && !isLoading && !error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Online Test</DialogTitle>
            <DialogDescription>
              This will create an online test from your paper. Students in your
              organization will be able to attempt the test using a shareable
              link.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onCreateTest}>Create Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Creating Online Test</DialogTitle>
            <DialogDescription>
              Please wait while we set up your online test...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Failed to Create Test
            </DialogTitle>
            <DialogDescription>{error}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Success state - show link
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-green-600">
            {alreadyExists ? "Online Test Ready" : "Online Test Created!"}
          </DialogTitle>
          <DialogDescription>
            {alreadyExists
              ? "An online test already exists for this paper. Share the link below with your students."
              : "Your online test is ready! Share the link below with your students."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {testTitle && (
            <div>
              <Label className="text-sm text-muted-foreground">Test Name</Label>
              <p className="font-medium">{testTitle}</p>
            </div>
          )}

          <div>
            <Label className="text-sm text-muted-foreground">Test Code</Label>
            <p className="font-mono text-lg font-bold tracking-wider">
              {shareCode}
            </p>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">
              Shareable Link
            </Label>
            <div className="mt-1 flex gap-2">
              <Input
                readOnly
                value={shareUrl || ""}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpenInNewTab}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">Instructions for students:</p>
            <ol className="mt-1 list-inside list-decimal space-y-1">
              <li>Open the link in their browser</li>
              <li>Log in with their student account</li>
              <li>Click "Start Test" to begin</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
