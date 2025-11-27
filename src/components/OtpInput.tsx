import React, { useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  numberOfInputs?: number;
  hasError?: boolean;
  inputClassName?: string;
  containerClassName?: string;
  disabled?: boolean;
  name?: string;
}

const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  numberOfInputs = 6,
  hasError = false,
  inputClassName,
  containerClassName,
  disabled = false,
  name = "otp",
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, newValue: string) => {
    // Only allow single digit
    const digit = newValue.slice(-1);

    if (!/^\d*$/.test(digit)) return; // Only allow numbers

    const currentValue = value || "";
    const newOtp = currentValue.padEnd(numberOfInputs, " ").split("");
    newOtp[index] = digit;
    const updatedOtp = newOtp.join("").trimEnd();

    onChange(updatedOtp);

    // Move to next input if digit was entered
    if (digit && index < numberOfInputs - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const currentValue = value || "";

    if (e.key === "Backspace") {
      if (!currentValue[index] && index > 0) {
        // If current input is empty, move to previous and clear it
        inputRefs.current[index - 1]?.focus();
        const newOtp = currentValue.padEnd(numberOfInputs, " ").split("");
        newOtp[index - 1] = "";
        onChange(newOtp.join("").trimEnd());
      } else {
        // Clear current input
        const newOtp = currentValue.padEnd(numberOfInputs, " ").split("");
        newOtp[index] = "";
        onChange(newOtp.join("").trimEnd());
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < numberOfInputs - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const digits = pastedData.replace(/\D/g, "").slice(0, numberOfInputs);

    onChange(digits);

    // Focus on the next empty input or the last input
    const nextIndex = Math.min(digits.length, numberOfInputs - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleFocus = (index: number) => {
    // Select the content on focus for easier editing
    inputRefs.current[index]?.select();
  };

  return (
    <div className={`flex justify-between gap-2 ${containerClassName || ""}`}>
      {[...Array(numberOfInputs)].map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={(value || "")[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={
            inputClassName ||
            `w-12 h-16 text-center text-2xl font-medium rounded-lg border ${
              hasError ? "border-red-500" : "border-gray-300"
            } ${
              disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
            } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`
          }
          aria-label={`Digit ${index + 1} of ${numberOfInputs}`}
        />
      ))}
      <input type="hidden" name={name} value={value || ""} />
    </div>
  );
};

export default OtpInput;
