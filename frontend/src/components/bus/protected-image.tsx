"use client";

import { useEffect, useState } from "react";
import { ImageOff, RefreshCw } from "lucide-react";

import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function ProtectedImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) return;
    let active = true;
    let url: string | null = null;
    setObjectUrl(null);
    setFailed(false);
    apiFetch.blob(src)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setObjectUrl(url);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-surface-container-high text-on-surface-variant", className)}>
        <ImageOff className="size-6" />
      </div>
    );
  }
  if (!objectUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-surface-container-high text-on-surface-variant", className)}>
        <RefreshCw className="size-5 animate-spin" />
      </div>
    );
  }
  return <img src={objectUrl} alt={alt} className={cn("object-cover", className)} />;
}
