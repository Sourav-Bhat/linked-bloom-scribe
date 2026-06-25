import { cn } from "@/lib/utils";

interface BrandLogoProps {
  /** size of the gradient mark in px */
  size?: number;
  /** show the "LinkedBloom" wordmark next to the mark */
  withWordmark?: boolean;
  /** wordmark color — defaults to inherit/foreground; pass "light" on dark surfaces */
  tone?: "dark" | "light";
  className?: string;
}

/** The LinkedBloom "bloom" mark — a gradient tile with a stylised flourish. */
const BrandLogo = ({ size = 36, withWordmark = true, tone = "dark", className }: BrandLogoProps) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    <div
      className="brand-gradient grid place-items-center rounded-[10px] shadow-brand-2 shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.56, height: size * 0.56 }}>
        <path d="M12 3c-1 3.5-3 5.5-6.5 6.5C9 10.5 11 12.5 12 16c1-3.5 3-5.5 6.5-6.5C15 8.5 13 6.5 12 3z" fill="#fff" />
        <path d="M12 14c-.6 2-1.7 3.1-3.7 3.7C10.3 18.3 11.4 19.4 12 21.4c.6-2 1.7-3.1 3.7-3.7C13.7 17.1 12.6 16 12 14z" fill="#fff" opacity=".75" />
      </svg>
    </div>
    {withWordmark && (
      <span
        className={cn(
          "font-bold tracking-tight text-[17px]",
          tone === "light" ? "text-white" : "text-brand-900",
        )}
      >
        Linked<span className="text-gold-500">Bloom</span>
      </span>
    )}
  </div>
);

export default BrandLogo;
