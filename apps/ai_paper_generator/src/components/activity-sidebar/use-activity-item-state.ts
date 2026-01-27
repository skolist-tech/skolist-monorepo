import { useState, useRef, useEffect } from "react";
import type { Activity } from "@skolist/db";

export function useActivityItemState(
  activity: Activity,
  onRename: (newName: string) => Promise<void>,
  onDelete: () => Promise<void>
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(activity.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== activity.name) {
      await onRename(trimmedName);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(activity.name);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return {
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    isDeleting,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    inputRef,
    handleSave,
    handleCancel,
    handleDelete,
  };
}
