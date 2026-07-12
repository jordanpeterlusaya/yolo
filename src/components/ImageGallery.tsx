"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[16/10] bg-gray-100 rounded-2xl flex items-center justify-center">
        <span className="text-gray-400">No images available</span>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100">
        <Image
          src={images[activeIndex]}
          alt={`${title} - Image ${activeIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 70vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`relative w-24 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                i === activeIndex ? "border-brand-500" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
