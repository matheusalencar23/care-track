import Input, { type InputProps } from "./input";

type Props = Omit<InputProps, "type">;

export default function DateInput({ className = "", ...props }: Props) {
  return (
    <Input type="date" className={`scheme-dark ${className}`} {...props} />
  );
}
