import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "group/input-group relative flex w-full flex-col overflow-hidden rounded-lg border border-input bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  "flex shrink-0 items-center gap-1 text-sm text-muted-foreground",
  {
    variants: {
      align: {
        "inline-start": "absolute inset-y-0 left-0 z-10 pl-3",
        "inline-end": "absolute inset-y-0 right-0 z-10 pr-3",
        "block-start": "order-first min-h-10 w-full px-2 py-1.5",
        "block-end": "order-last min-h-10 w-full px-2 py-1.5",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

function InputGroupAddon({
  className,
  align = "inline-start",
  onClick,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      data-align={align}
      data-slot="input-group-addon"
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          (event.target as HTMLElement).closest(
            "button,input,textarea,select,[contenteditable='true']",
          )
        ) {
          return;
        }
        event.currentTarget.parentElement?.querySelector("textarea")?.focus();
      }}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn("inline-flex items-center gap-1.5 text-xs", className)}
      {...props}
    />
  );
}

function InputGroupButton({
  className,
  size,
  variant = "ghost",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="input-group-button"
      className={cn("shrink-0", className)}
      size={size ?? "icon"}
      variant={variant}
      {...props}
    />
  );
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="input-group-control"
      className={cn(
        "min-h-48 w-full flex-1 resize-none border-0 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
};
