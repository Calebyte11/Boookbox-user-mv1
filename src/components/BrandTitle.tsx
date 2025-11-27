import React from "react";
import Brand from "@/assets/svg/Brand.svg";

interface BrandType {
  title?: string;
  description?: string;
  className?: string;
  descriptionClassName?: string;
  titleClassName?: string;
  brandImg?: boolean;
  brandImgClassname?: string;
}

const BrandTitle: React.FC<BrandType> = ({
  title,
  description,
  className,
  descriptionClassName,
  titleClassName,
  brandImg = false,
  brandImgClassname,
}) => {
  return (
    <div className={`${className}`}>
      {/* Remove problematic Link and make it safer for iOS PWA */}
      <div className="flex justify-center items-center">
        {brandImg ? (
          <img
            src={Brand}
            alt="BoookBox Brand Logo"
            className={`${brandImgClassname} w-3/2`}
            style={{
              maxWidth: '100%',
              height: 'auto',
              aspectRatio: 'auto'
            }}
            onError={(e) => {
              console.warn('Brand logo failed to load:', e);
              // Fallback to text if image fails
              (e.target as HTMLImageElement).style.display = 'none';
              const fallback = document.createElement('h1');
              fallback.textContent = title || 'BoookBox';
              fallback.className = `font-inter font-extrabold text-brand-heading leading-brand-heading tracking-brand-heading text-[color:var(--color-primary)] tracking-tighter ${titleClassName}`;
              (e.target as HTMLImageElement).parentNode?.appendChild(fallback);
            }}
          />
        ) : (
          <h1
            className={`font-inter font-extrabold text-brand-heading leading-brand-heading tracking-brand-heading text-[color:var(--color-primary)] tracking-tighter ${titleClassName}`}
          >
            {title}
          </h1>
        )}
      </div>
      <p
        className={`font-mf text-button-label-1 leading-button-label-1 tracking-button-label-1 ${descriptionClassName}`}
      >
        {description}
      </p>
    </div>
  );
};

export default BrandTitle;
