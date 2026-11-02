import type { ComponentProps } from "react";

type Props = ComponentProps<"button">;

export default function Button({
  type = "submit",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`mt-4 w-full rounded-xl bg-white py-3 font-semibold text-blue-700 transition hover:cursor-pointer hover:scale-[1.02] disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
