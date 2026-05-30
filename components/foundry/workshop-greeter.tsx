import { BrandMark } from "@/components/foundry/brand-mark";

type WorkshopGreeterProps = {
  size?: "sm" | "md";
  className?: string;
};

/** Decorative brand mark — canonical W app icon board (Squibb cutout is separate). */
export function WorkshopGreeter({ size = "sm", className = "" }: WorkshopGreeterProps) {
  return (
    <div
      className={`workshop-greeter workshop-greeter--${size}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <BrandMark size={size === "md" ? "md" : "sm"} />
    </div>
  );
}
