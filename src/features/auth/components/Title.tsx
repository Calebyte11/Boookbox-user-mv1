import React from 'react'

// Renamed to TitleProps for PascalCase convention and extended React.HTMLAttributes
type TitleProps = {
  title: string
  description: string
  titleClassName?: string
  descriptionClassName?: string
} & React.HTMLAttributes<HTMLDivElement>


const Title = ({
  title,
  description,
  titleClassName,
  descriptionClassName,
  className, // This className comes from HTMLAttributes
  ...rest // Capture other HTML attributes to spread
}: TitleProps) => {
  return (
    // Spread ...rest props onto the root div
    // Use ?? '' for optional className props to prevent "undefined" in class string
    <div className={`mb-4 ${className ?? ''}`} {...rest}>
      <h1 className={`font-semibold text-2xl text-black mb-2 ${titleClassName ?? ''}`}>
       {title}
      </h1>
      <p className={`${descriptionClassName ?? ''}`}>{description}</p>
    </div>
  );
}

export default Title
