import { toast as sonnerToast } from "sonner"

export const toast = {
  title: (title) => {
    sonnerToast(title)
  },
  description: (description) => {
    sonnerToast("Notification", {
      description,
    })
  },
  error: (description) => {
    sonnerToast.error("Error", {
      description,
    })
  },
  success: (description) => {
    sonnerToast.success("Success", {
      description,
    })
  },
}

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