import React from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */
interface ButtonType {
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  handleClick?: () => void;
  children?: React.ReactNode;
  [key:string]:any
}

const Button: React.FC<ButtonType> = ({
  children,
  className,
  type,
  disabled,
  handleClick,
  ...rest
}: ButtonType) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`cursor-pointer ${className}`}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
