import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-none border border-hairline-strong bg-surface-card px-4 py-3 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-elevated/50 disabled:opacity-50 aria-invalid:border-semantic-error aria-invalid:ring-3 aria-invalid:ring-semantic-error/20 md:text-sm dark:bg-surface-card dark:disabled:bg-surface-elevated dark:aria-invalid:border-semantic-error/50 dark:aria-invalid:ring-semantic-error/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
