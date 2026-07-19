"use client";

import {
  useFormStatus,
} from "react-dom";

type SubmitButtonProps = {
  idleText: string;
  pendingText: string;
  className?: string;
  disabled?: boolean;
};

export function SubmitButton({
  idleText,
  pendingText,
  className,
  disabled = false,
}: SubmitButtonProps) {
  const { pending } =
    useFormStatus();

  return (
    <button
      type="submit"
      disabled={
        disabled || pending
      }
      aria-disabled={
        disabled || pending
      }
      className={className}
    >
      {pending
        ? pendingText
        : idleText}
    </button>
  );
}