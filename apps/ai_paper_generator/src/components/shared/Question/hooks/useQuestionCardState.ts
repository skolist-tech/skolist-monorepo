import { useState, useRef, useEffect } from "react";
import { useToast } from "@skolist/ui";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";
import type { GeneratedQuestion, GeneratedImage } from "@skolist/db";
import {
  uploadQuestionImage,
  deleteQuestionImage,
  updateQuestionImageSvg,
} from "../../../../services/questionService";

interface UseQuestionCardStateProps {
  question: GeneratedQuestionWithConcepts;
  onUpdate?: (updatedQuestion: GeneratedQuestionWithConcepts) => void;
}

export function useQuestionCardState({
  question,
  onUpdate,
}: UseQuestionCardStateProps) {
  const { toast } = useToast();

  // -- Editing State --
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] =
    useState<GeneratedQuestionWithConcepts>(question);

  // Sync images from question prop when they change
  useEffect(() => {
    setEditedQuestion((prev) => ({
      ...prev,
      images: question.images,
    }));
  }, [question.images]);

  const updateField = <K extends keyof GeneratedQuestion>(
    field: K,
    value: GeneratedQuestion[K]
  ) => {
    setEditedQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        ...editedQuestion,
        // Ensure critical metadata is fresh from props to prevent overwriting
        // with stale state (e.g. if question order changed while editing)
        position_in_draft: question.position_in_draft,
        qgen_draft_section_id: question.qgen_draft_section_id,
        is_page_break_below: question.is_page_break_below,
        is_in_draft: question.is_in_draft,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedQuestion(question);
    setIsEditing(false);
  };

  // -- Attachment / Upload State --
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsAttaching(true);
    // Simulate upload delay
    setTimeout(() => {
      setAttachedFiles((prev) => [...prev, ...files]);
      setIsAttaching(false);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
    }, 1500);
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await uploadQuestionImage(file, question.id);
      // Wait briefly for UI feedback; realtime subscription handles the update
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // -- Delete States --
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteImageModalOpen, setIsDeleteImageModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const handleDeleteImage = (imageId: string) => {
    setImageToDelete(imageId);
    setIsDeleteImageModalOpen(true);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      // Optimistic update
      const updatedQuestion = {
        ...editedQuestion,
        // Ensure critical metadata is fresh from props
        position_in_draft: question.position_in_draft,
        qgen_draft_section_id: question.qgen_draft_section_id,
        is_page_break_below: question.is_page_break_below,
        is_in_draft: question.is_in_draft,
        images: (editedQuestion.images || []).filter(
          (img) => img.id !== imageToDelete
        ),
      };
      setEditedQuestion(updatedQuestion);

      await deleteQuestionImage(imageToDelete);

      if (onUpdate) {
        onUpdate(updatedQuestion);
      }
    } catch (error) {
      console.error("[DELETE IMAGE] Failed to delete image:", error);
      setEditedQuestion(question); // Revert
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setIsDeleteImageModalOpen(false);
      setImageToDelete(null);
    }
  };

  // -- Regenerate / Prompt State --
  const [prompt, setPrompt] = useState("");
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);

  // -- Edit SVG State --
  const [isEditSvgOpen, setIsEditSvgOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<GeneratedImage | null>(null);
  const [isSavingSvg, setIsSavingSvg] = useState(false);

  const handleEditSvg = (image: GeneratedImage) => {
    setImageToEdit(image);
    setIsEditSvgOpen(true);
  };

  const handleSaveSvg = async (imageId: string, svgString: string) => {
    try {
      setIsSavingSvg(true);

      // Optimistic update
      const updatedQuestion = {
        ...editedQuestion,
        position_in_draft: question.position_in_draft,
        qgen_draft_section_id: question.qgen_draft_section_id,
        is_page_break_below: question.is_page_break_below,
        is_in_draft: question.is_in_draft,
        images: (editedQuestion.images || []).map((img) =>
          img.id === imageId ? { ...img, svg_string: svgString } : img
        ),
      };
      setEditedQuestion(updatedQuestion);

      // Save to database
      await updateQuestionImageSvg(imageId, svgString);

      if (onUpdate) {
        onUpdate(updatedQuestion);
      }

      toast({
        title: "SVG Updated",
        description: "The SVG has been updated successfully.",
      });
    } catch (error) {
      console.error("[EDIT SVG] Failed to save SVG:", error);
      setEditedQuestion(question); // Revert
      toast({
        title: "Error",
        description: "Failed to save SVG changes",
        variant: "destructive",
      });
      throw error; // Re-throw so the dialog knows it failed
    } finally {
      setIsSavingSvg(false);
      setImageToEdit(null);
    }
  };

  // Handler for when AI updates an SVG (already saved to DB by the API)
  const handleAiSvgUpdate = (imageId: string, svgString: string) => {
    const updatedQuestion = {
      ...editedQuestion,
      position_in_draft: question.position_in_draft,
      qgen_draft_section_id: question.qgen_draft_section_id,
      is_page_break_below: question.is_page_break_below,
      is_in_draft: question.is_in_draft,
      images: (editedQuestion.images || []).map((img) =>
        img.id === imageId ? { ...img, svg_string: svgString } : img
      ),
    };
    setEditedQuestion(updatedQuestion);

    if (onUpdate) {
      onUpdate(updatedQuestion);
    }

    toast({
      title: "SVG Updated",
      description: "AI has updated the SVG successfully.",
    });
  };

  return {
    isEditing,
    setIsEditing,
    editedQuestion,
    setEditedQuestion,
    updateField,
    handleSave,
    handleCancel,

    isUploading,
    fileInputRef,
    handleImageUpload,

    attachedFiles,
    setAttachedFiles,
    isAttaching,
    setIsAttaching,
    attachmentInputRef,
    handleAttachmentSelect,
    handleRemoveAttachment,

    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleteImageModalOpen,
    setIsDeleteImageModalOpen,
    imageToDelete,
    setImageToDelete,
    handleDeleteImage,
    confirmDeleteImage,

    prompt,
    setPrompt,
    isRegenerateOpen,
    setIsRegenerateOpen,

    isEditSvgOpen,
    setIsEditSvgOpen,
    imageToEdit,
    setImageToEdit,
    isSavingSvg,
    handleEditSvg,
    handleSaveSvg,
    handleAiSvgUpdate,
  };
}
