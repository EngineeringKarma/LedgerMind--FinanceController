"use client";

import { useCallback, useState, useRef } from "react";
import { authFetch } from "@/lib/auth";

interface UploadCardProps {
  onUploadComplete: (sessionId: string, transactionCount: number) => void;
}

export default function UploadCard({ onUploadComplete }: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a CSV file");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await authFetch(`${API_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Upload failed" }));
          throw new Error(err.detail || "Upload failed");
        }

        const data = await res.json();
        onUploadComplete(data.session_id, data.transaction_count);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="w-full max-w-xl">
      <div
        className={`upload-zone flex flex-col items-center justify-center p-12 cursor-pointer ${
          isDragging ? "drag-active" : ""
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onFileSelect}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-text-muted text-sm">Uploading...</span>
          </div>
        ) : (
          <>
            <svg
              className="w-12 h-12 text-text-dim mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-text-primary font-medium mb-1">
              Drop your settlement CSV here
            </p>
            <p className="text-text-muted text-sm">
              or click to browse — Razorpay-style format
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 px-4 py-2 rounded bg-state-anomaly/10 border border-state-anomaly/30 text-state-anomaly text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
