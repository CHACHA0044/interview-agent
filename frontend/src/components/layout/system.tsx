import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ContainerSize = "hero" | "content" | "dashboard" | "reading" | "form" | "chat" | "full";

const containerClassMap: Record<ContainerSize, string> = {
  hero: "container-hero",
  content: "container-content",
  dashboard: "container-dashboard",
  reading: "container-reading",
  form: "container-form",
  chat: "container-chat",
  full: "container-full",
};

interface LayoutContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
  size?: ContainerSize;
}

export function LayoutContainer({ as: Comp = "div", size = "content", className, ...props }: LayoutContainerProps) {
  return <Comp className={cn("layout-container", containerClassMap[size], className)} {...props} />;
}

interface SectionProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  density?: "default" | "tight" | "relaxed";
}

const densityMap = {
  default: "section-space",
  tight: "section-space-tight",
  relaxed: "section-space-relaxed",
} as const;

export function Section({ as: Comp = "section", density = "default", className, ...props }: SectionProps) {
  return <Comp className={cn(densityMap[density], className)} {...props} />;
}

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  gap?: "sm" | "md" | "lg";
}

const gapMap = {
  sm: "layout-grid-gap-sm",
  md: "layout-grid-gap-md",
  lg: "layout-grid-gap-lg",
} as const;

export function LayoutGrid({ gap = "md", className, ...props }: GridProps) {
  return <div className={cn("layout-grid", gapMap[gap], className)} {...props} />;
}

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: "xs" | "sm" | "md" | "lg";
}

const stackGapMap = {
  xs: "stack-xs",
  sm: "stack-sm",
  md: "stack-md",
  lg: "stack-lg",
} as const;

export function Stack({ gap = "md", className, ...props }: StackProps) {
  return <div className={cn("stack", stackGapMap[gap], className)} {...props} />;
}

interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  gap?: "sm" | "md" | "lg";
}

const clusterGapMap = {
  sm: "cluster-sm",
  md: "cluster-md",
  lg: "cluster-lg",
} as const;

export function Cluster({ gap = "md", className, ...props }: ClusterProps) {
  return <div className={cn("cluster", clusterGapMap[gap], className)} {...props} />;
}

interface PageHeadingProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  align?: "left" | "center";
}

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  align = "left",
}: PageHeadingProps) {
  return (
    <header className={cn("page-heading", align === "center" && "!flex-col !items-center !text-center !justify-center !border-b-0 !pb-0")}> 
      <div className={cn("stack stack-sm max-w-reading", align === "center" && "mx-auto items-center text-center")}>
        {eyebrow}
        <h1 className="heading-display">{title}</h1>
        {description ? <p className="text-body text-[#A3A3A3]">{description}</p> : null}
      </div>
      {actions ? <div className="cluster cluster-sm">{actions}</div> : null}
    </header>
  );
}

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  elevated?: boolean;
}

const surfacePaddingMap = {
  sm: "surface-padding-sm",
  md: "surface-padding-md",
  lg: "surface-padding-lg",
} as const;

export function Surface({
  padding = "md",
  elevated = false,
  className,
  style,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn("surface", surfacePaddingMap[padding], elevated && "surface-elevated", className)}
      style={style as CSSProperties}
      {...props}
    />
  );
}
