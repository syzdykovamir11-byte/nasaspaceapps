import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import type { Status } from "../lib/analysis";
import { SOURCES } from "../lib/content";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
};

export function Button({ variant = "primary", icon, className, children, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl px-5 text-lg font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" && "bg-field text-white shadow-sm hover:bg-field-600",
        variant === "secondary" && "border-2 border-field/25 bg-card text-field hover:border-field/50",
        variant === "ghost" && "text-field hover:bg-field-50",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export const STATUS_LOOK: Record<Status, { word: string; Icon: typeof Eye; pill: string; bar: string }> = {
  red: { word: "Unusual", Icon: AlertTriangle, pill: "bg-bad-50 text-bad", bar: "bg-bad" },
  amber: { word: "Watch", Icon: Eye, pill: "bg-warn-50 text-warn", bar: "bg-warn" },
  green: { word: "Normal", Icon: CheckCircle2, pill: "bg-ok-50 text-ok", bar: "bg-ok" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { word, Icon, pill } = STATUS_LOOK[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-semibold", pill)}>
      <Icon className="size-5" aria-hidden />
      {word}
    </span>
  );
}

export function Src({ ids }: { ids: readonly number[] }) {
  if (!ids.length) return null;
  return (
    <span className="ml-1 inline-flex gap-1 align-middle">
      {ids.map((id) => {
        const s = SOURCES.find((x) => x.id === id)!;
        return (
          <a
            key={id}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            title={s.title}
            className="rounded-md bg-field-50 px-1.5 text-sm font-semibold text-field no-underline hover:bg-field hover:text-white"
          >
            {id}
          </a>
        );
      })}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-3xl border border-line bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/.04)]", className)}>{children}</div>;
}

export { cx };
