import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary";

type Props = ComponentProps<typeof Link> & {
  variant?: Variant;
  block?: boolean;
};

const variantClassNames: Record<Variant, string> = {
  primary: "bg-white text-blue-700 hover:scale-[1.02]",
  secondary: "border border-white/20 bg-white/10 text-white hover:bg-white/20",
};

/** Link com o mesmo visual do `Button`, para ações que só navegam. */
export default function LinkButton({
  variant = "primary",
  block = true,
  className = "",
  ...props
}: Props) {
  return (
    <Link
      className={`rounded-xl py-3 text-center font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${variantClassNames[variant]} ${block ? "mt-4 block w-full" : "inline-flex items-center justify-center gap-2 px-5"} ${className}`}
      {...props}
    />
  );
}
