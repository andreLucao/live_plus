"use client"

import { toast as sonnerToast } from "sonner"

export const useToast = () => {
  return {
    toast: ({ title, description, variant, ...props }) => {
      if (variant === "destructive") {
        return sonnerToast.error(title, {
          description,
          ...props,
        })
      }
      
      return sonnerToast(title, {
        description,
        ...props,
      })
    },
  }
}

export { sonnerToast as toast } 