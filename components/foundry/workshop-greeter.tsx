type WorkshopGreeterProps = {
  size?: "sm" | "md";
  className?: string;
};

/** Decorative brand mark — warm placeholder until Brass/Squibb cutouts land. */
export function WorkshopGreeter({ size = "sm", className = "" }: WorkshopGreeterProps) {
  return (
    <div
      className={`workshop-greeter workshop-greeter--${size}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <img src="/assets/werkles-mark-transparent.png" alt="" width={size === "md" ? 52 : 40} height={size === "md" ? 52 : 40} />
    </div>
  );
}
