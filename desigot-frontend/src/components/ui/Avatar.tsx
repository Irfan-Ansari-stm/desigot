import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  verified?: boolean;
}

const sizeMap = {
  xs:  { wrapper: "h-6 w-6",  text: "text-[10px]", badge: "h-2.5 w-2.5 -bottom-0.5 -right-0.5" },
  sm:  { wrapper: "h-8 w-8",  text: "text-xs",     badge: "h-3 w-3 -bottom-0.5 -right-0.5" },
  md:  { wrapper: "h-10 w-10",text: "text-sm",     badge: "h-3.5 w-3.5 bottom-0 right-0" },
  lg:  { wrapper: "h-14 w-14",text: "text-base",   badge: "h-4 w-4 bottom-0 right-0" },
  xl:  { wrapper: "h-20 w-20",text: "text-xl",     badge: "h-5 w-5 bottom-1 right-0" },
};

export function Avatar({ src, name = "U", size = "md", className, verified }: AvatarProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("relative shrink-0", className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn("rounded-full object-cover", s.wrapper)}
        />
      ) : (
        <div className={cn(
          "rounded-full flex items-center justify-center bg-gradient-to-br from-accent2 to-accent3 text-white font-semibold",
          s.wrapper, s.text
        )}>
          {getInitials(name)}
        </div>
      )}
      {verified && (
        <div className={cn(
          "absolute flex items-center justify-center bg-white rounded-full",
          s.badge
        )}>
          <div className="h-full w-full rounded-full bg-success flex items-center justify-center">
            <svg viewBox="0 0 10 10" className="h-full w-full p-0.5 text-white" fill="currentColor">
              <path d="M3 5.5L4.5 7 7 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
