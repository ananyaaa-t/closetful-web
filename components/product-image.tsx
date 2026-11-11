"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setFailedSource(null)}
            className="h-auto min-h-8 whitespace-normal px-1 text-xs"
          >
            <RotateCw aria-hidden="true" className="h-3 w-3" /> Retry photo
          </Button>
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
