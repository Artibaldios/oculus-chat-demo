"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({ ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  side = "top",
  align = "center",
  sideOffset = 8,
  ...props
}: TooltipPrimitive.Popup.Props & {
  side?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["side"]
  align?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["align"]
  sideOffset?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["sideOffset"]
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 overflow-hidden rounded-md border border-border/50 bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md transition duration-150 ease-out data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95 data-[side=bottom]:data-ending-style:translate-y-1 data-[side=bottom]:data-starting-style:translate-y-1 data-[side=left]:data-ending-style:-translate-x-1 data-[side=left]:data-starting-style:-translate-x-1 data-[side=right]:data-ending-style:translate-x-1 data-[side=right]:data-starting-style:translate-x-1 data-[side=top]:data-ending-style:-translate-y-1 data-[side=top]:data-starting-style:-translate-y-1",
            className
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
