import { useEffect, useRef, useState, type ReactNode } from "react";
import { QuestionFigure } from "@/components/shared/QuestionFigure";

export type BlockSave = {
  text: string;
  file: File | null;
  removeImage: boolean;
  correct?: boolean;
  answer?: string;
};

type Props = {
  label: string;
  text: string;
  imageUrl?: string | null;
  svgCode?: string | null;
  correct?: boolean;
  answer?: string | null;
  answerLabel?: string;
  onSave: (save: BlockSave) => Promise<void>;
  children: ReactNode;
};

export function EditableBlock({
  label,
  text,
  imageUrl,
  svgCode,
  correct,
  answer,
  answerLabel,
  onSave,
  children,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(text);
  const [draftCorrect, setDraftCorrect] = useState(Boolean(correct));
  const [draftAnswer, setDraftAnswer] = useState(answer ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function reset() {
    setDraftText(text);
    setDraftCorrect(Boolean(correct));
    setDraftAnswer(answer ?? "");
    setFile(null);
    setRemoveImage(false);
    setError(null);
  }

  if (!editing) {
    return (
      <div className="group relative">
        {children}
        <button
          type="button"
          aria-label={`Edit ${label}`}
          className="absolute right-1 top-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            reset();
            setEditing(true);
          }}
        >
          Edit
        </button>
      </div>
    );
  }

  const hasExistingImage = Boolean(imageUrl || svgCode) && !removeImage;
  const showImage = Boolean(previewUrl) || hasExistingImage;

  return (
    <div className="space-y-3 rounded border border-sky-400 bg-sky-50/40 p-3">
      <textarea
        aria-label={`${label} text`}
        className="min-h-20 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
        value={draftText}
        onChange={(event) => setDraftText(event.target.value)}
      />
      {showImage ? (
        <div className="relative inline-block rounded border border-slate-200 bg-white p-2">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`${label} image`}
              className="max-h-48 object-contain"
            />
          ) : (
            <QuestionFigure
              svgCode={svgCode}
              imageUrl={imageUrl}
              alt={`${label} image`}
              className="max-h-48 object-contain [&>svg]:max-h-48 [&>svg]:w-auto"
            />
          )}
          <button
            type="button"
            aria-label="Remove image"
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow"
            onClick={() => {
              if (file) {
                setFile(null);
              } else {
                setRemoveImage(true);
              }
            }}
          >
            ×
          </button>
        </div>
      ) : null}
      {correct !== undefined ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draftCorrect}
            onChange={(event) => setDraftCorrect(event.target.checked)}
          />
          Correct answer
        </label>
      ) : null}
      {answerLabel ? (
        <label className="flex max-w-xs flex-col gap-1 text-sm">
          {answerLabel}
          <input
            className="rounded border border-slate-300 bg-white px-3 py-2"
            value={draftAnswer}
            onChange={(event) => setDraftAnswer(event.target.value)}
          />
        </label>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        aria-label={`${label} image file`}
        onChange={(event) => {
          const picked = event.target.files?.[0] ?? null;
          setFile(picked);
          if (picked) setRemoveImage(false);
          event.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border border-slate-400 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
          onClick={() => fileInput.current?.click()}
        >
          Upload image
        </button>
        <button
          type="button"
          disabled={saving}
          className="rounded bg-green-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          onClick={() => {
            setSaving(true);
            setError(null);
            onSave({
              text: draftText,
              file,
              removeImage,
              correct: correct === undefined ? undefined : draftCorrect,
              answer: answerLabel ? draftAnswer : undefined,
            })
              .then(() => setEditing(false))
              .catch((err: Error) => setError(err.message))
              .finally(() => setSaving(false));
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={saving}
          className="rounded border border-slate-400 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
          onClick={() => {
            reset();
            setEditing(false);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
