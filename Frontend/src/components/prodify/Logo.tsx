export const Logo = ({ size = "md", variant = "brand" }: { size?: "sm" | "md" | "lg"; variant?: "brand" | "full" }) => {
  const sizes = {
    sm: { icon: "h-6 w-6", text: "text-sm", sub: "text-[10px]" },
    md: { icon: "h-8 w-8", text: "text-lg", sub: "text-[11px]" },
    lg: { icon: "h-12 w-12", text: "text-xl", sub: "text-xs" },
  }[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className="rounded-xl overflow-hidden shrink-0">
        <img 
          src="/logo.png"
          alt="Logo" 
          className={`${sizes.icon} object-contain`} 
        />
      </div>
      {variant === "full" ? (
        <div className="leading-none">
          <p className={`font-bold tracking-tight text-secondary ${sizes.text}`}>PRODIFY</p>
          <p className={`${sizes.sub} text-muted-foreground font-medium`}>RieFa Collection</p>
        </div>
      ) : (
        <div className="leading-tight">
          <p className={`font-bold tracking-tight text-primary ${sizes.text}`}>RieFa Collection</p>
        </div>
      )}
    </div>
  );
};