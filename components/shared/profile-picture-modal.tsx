"use client";

import { $http } from "@/lib/http";
import { userKeys } from "@/lib/react-query/query-keys";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ImagePlus, Loader2, Upload, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (profileImageUrl: string) => void;
}

interface ProfileImageUploadResponse {
  message: string;
  profile_image_url: string;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ProfilePictureModal = ({
  isOpen,
  onClose,
  onUploadComplete,
}: ProfilePictureModalProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Image must be ${MAX_FILE_SIZE_MB}MB or smaller.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      return objectUrl;
    });

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);

    try {
      const { data } = await $http.post<ProfileImageUploadResponse>(
        "/user/profile-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      await queryClient.invalidateQueries({ queryKey: userKeys.me });
      onUploadComplete?.(data.profile_image_url);
      toast.success(data.message || "Profile image uploaded successfully.");
      onClose();
    } catch (error) {
      console.error("Profile image upload error:", error);
      toast.error("Could not upload profile image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = (file?: File) => {
    if (!file || isUploading) return;
    void uploadImage(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  if (!isMounted) return null;

  return createPortal(
    <section className="fixed inset-0 z-9999 bg-[#32475C80] flex items-center justify-center px-4">
      <div className="w-full max-w-204 bg-white p-8 md:p-12 rounded-lg shadow-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-2 text-gray-600">
            <h1 className="text-base font-semibold">Add profile picture</h1>
            <p className="text-sm text-gray-500">
              Drop an image here or choose one from your device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer transition-all duration-300 text-gray-600 hover:text-red-500"
            aria-label="Close profile picture modal"
          >
            <X size={20} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div
          role="button"
          tabIndex={0}
          aria-label="Upload profile image"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={cn(
            "group relative flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition-all duration-300 ease-out",
            "hover:-translate-y-1 hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10",
            isDragging &&
              "scale-[1.02] border-primary bg-primary/10 shadow-xl shadow-primary/15",
            isUploading && "pointer-events-none cursor-wait opacity-80",
          )}
        >
          <div
            className={cn(
              "absolute inset-4 rounded-2xl border border-primary/0 transition-all duration-300",
              "group-hover:inset-3 group-hover:border-primary/20",
              isDragging && "inset-3 border-primary/40 bg-white/30",
            )}
          />

          <div className="relative z-10 flex flex-col items-center">
            <div
              className={cn(
                "mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-all duration-300",
                "group-hover:scale-110 group-hover:shadow-md",
                isDragging && "scale-110 animate-pulse",
              )}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : previewUrl ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : isDragging ? (
                <Upload className="h-8 w-8" />
              ) : (
                <ImagePlus className="h-8 w-8" />
              )}
            </div>

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected profile preview"
                className="mb-5 h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-md"
              />
            ) : null}

            <h2 className="text-lg font-semibold text-gray-700">
              {isUploading
                ? "Uploading image..."
                : isDragging
                  ? "Release to upload"
                  : "Drag and drop your image here"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              JPG, PNG, GIF, or WebP up to {MAX_FILE_SIZE_MB}MB. Click this area
              to browse manually.
            </p>
          </div>
        </div>
      </div>
    </section>,
    document.body,
  );
};

export default ProfilePictureModal;
