"use client";

import { useState } from "react";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export function BookCover({
  src,
  alt,
  fill = true,
  width,
  height,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100px, 160px",
}: BookCoverProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Normalize image source: ensure http is upgraded to https
  const normalizedSrc = src
    ? src.startsWith("http://")
      ? src.replace("http://", "https://")
      : src
    : null;

  const showFallback = !normalizedSrc || hasError;

  if (showFallback) {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center overflow-hidden bg-muted/60 text-muted-foreground border border-border/40 select-none",
          fill ? "h-full w-full" : "",
          className
        )}
      >
        <BookOpen className="h-5 w-5 opacity-40 shrink-0 mb-1" />
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/70 text-center px-1 line-clamp-2 leading-tight">
          {alt || "Book"}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted/20", fill ? "h-full w-full" : "", className)}>
      <Image
        src={normalizedSrc}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={sizes}
        priority={priority}
        unoptimized
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/40 animate-pulse flex items-center justify-center">
          <BookOpen className="h-4 w-4 opacity-25" />
        </div>
      )}
    </div>
  );
}
