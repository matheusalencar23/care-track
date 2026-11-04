import { ApiError } from "@/shared/ApiError";

interface Props {
  error: unknown;
  className?: string;
}

export default function RequestId({ error, className = "" }: Props) {
  if (!(error instanceof ApiError) || !error.requestId) {
    return null;
  }

  return (
    <p className={`text-xs opacity-80 ${className}`}>
      Código para o suporte:{" "}
      <span className="select-all font-mono">{error.requestId}</span>
    </p>
  );
}
