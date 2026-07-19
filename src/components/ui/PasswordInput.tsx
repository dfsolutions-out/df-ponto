"use client";

import {
  Eye,
  EyeOff,
} from "lucide-react";
import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
} from "react";

type PasswordInputProps =
  InputHTMLAttributes<HTMLInputElement> & {
    error?: boolean;
  };

export const PasswordInput = forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(function PasswordInput(
  {
    className,
    error = false,
    disabled,
    ...props
  },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        type={visible ? "text" : "password"}
        disabled={disabled}
        aria-invalid={error}
        className={[
          "h-12 w-full rounded-xl border bg-slate-950 px-4 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600",
          error
            ? "border-red-500/60 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
            : "border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "",
          className ?? "",
        ].join(" ")}
      />

      <button
        type="button"
        onClick={() => {
          setVisible((current) => !current);
        }}
        disabled={disabled}
        aria-label={
          visible
            ? "Ocultar senha"
            : "Mostrar senha"
        }
        title={
          visible
            ? "Ocultar senha"
            : "Mostrar senha"
        }
        className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visible ? (
          <EyeOff
            aria-hidden="true"
            className="size-5"
          />
        ) : (
          <Eye
            aria-hidden="true"
            className="size-5"
          />
        )}
      </button>
    </div>
  );
});