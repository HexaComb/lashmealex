import Image from "next/image";

type CoverImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Cover-cropped image with intrinsic width/height for CLS and a sizes
 * attribute so next/image can serve a correctly sized srcset candidate.
 */
export default function CoverImage({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  className,
}: CoverImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      className={className}
    />
  );
}
