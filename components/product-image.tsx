"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, RotateCw } from "lucide-react";

export function ProductImage({
  src,
  alt,
  className = "object-contain",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (!src || src === failedSource) {
    return (
      <div className="flex h-full min-h-14 w-full flex-col items-center justify-center gap-2 p-2 text-center text-xs text-[#FDF8F9]/60">
        <ImageOff aria-hidden="true" className="h-5 w-5" />
        <span>{src ? "Photo couldn't load" : "Photo unavailable"}</span>
        {src && (
          <button
            type="button"
            onClick={() => setFailedSource(null)}
            className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4"
          >
            <RotateCw aria-hidden="true" className="h-3 w-3" /> Retry photo
          </button>
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width: 1024px) 25vw, 50vw"
      unoptimized
      referrerPolicy="no-referrer"
      onError={() => setFailedSource(src)}
      className={className}
    />
  );
}
