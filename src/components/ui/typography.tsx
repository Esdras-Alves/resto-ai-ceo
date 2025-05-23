
import React from "react";
import { cn } from "@/lib/utils";

export function TypographyH1({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h1 className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl", className)}>
      {children}
    </h1>
  );
}

export function TypographyH2({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10 first:mt-0", className)}>
      {children}
    </h2>
  );
}

export function TypographyH3({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("scroll-m-20 text-2xl font-semibold tracking-tight mt-8", className)}>
      {children}
    </h3>
  );
}

export function TypographyH4({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h4 className={cn("scroll-m-20 text-xl font-semibold tracking-tight mt-6", className)}>
      {children}
    </h4>
  );
}

export function TypographyP({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("leading-7 [&:not(:first-child)]:mt-4", className)}>
      {children}
    </p>
  );
}

export function TypographyList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ul className={cn("my-4 ml-6 list-disc [&>li]:mt-2", className)}>
      {children}
    </ul>
  );
}
