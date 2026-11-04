import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "danger";

type Props = ComponentProps<"button"> & {
  variant?: Variant;
  block?: boolean;
};

const variantClassNames: Record<Variant, string> = {
  primary: "bg-white text-blue-700 hover:scale-[1.02]",
  secondary:
    "border border-white/20 bg-white/10 text-white hover:bg-white/20",
  danger: "bg-danger-600 text-white hover:bg-danger-500",
};

export default function Button({
  type = "submit",
  variant = "primary",
  block = true,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`rounded-xl px-5 py-3 font-semibold transition hover:cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variantClassNames[variant]} ${block ? "mt-4 w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
