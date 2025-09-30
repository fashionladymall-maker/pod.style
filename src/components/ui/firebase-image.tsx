'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FirebaseImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function FirebaseImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  sizes,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}: FirebaseImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if this is a Firebase Storage URL
  const isFirebaseStorage = src.includes('storage.googleapis.com') || src.includes('firebasestorage.app');

  // For Firebase Storage images, use direct URL to avoid Next.js optimization timeout
  const imageSrc = src;

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  if (imageError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gray-100 text-gray-400 text-sm",
          fill ? "absolute inset-0" : "",
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">🖼️</div>
          <div>Image not available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", fill ? "w-full h-full" : "", className)}>
      {isLoading && (
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse",
            fill ? "" : "rounded"
          )}
          style={!fill ? { width, height } : undefined}
        >
          <div className="text-gray-400">
            <svg 
              className="w-8 h-8 animate-spin" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          fill ? "object-cover" : "",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        // Always disable optimization for Firebase Storage images to avoid timeout
        unoptimized={isFirebaseStorage}
        // Enable lazy loading for better performance
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}
