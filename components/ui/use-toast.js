import { useToast as useToastOriginal } from "@/components/ui/toast"

export const toast = {
  title: (title) => {
    const { toast } = useToastOriginal()
    toast({
      title,
    })
  },
  description: (description) => {
    const { toast } = useToastOriginal()
    toast({
      description,
    })
  },
  error: (description) => {
    const { toast } = useToastOriginal()
    toast({
      title: "Error",
      description,
      variant: "destructive",
    })
  },
  success: (description) => {
    const { toast } = useToastOriginal()
    toast({
      title: "Success",
      description,
    })
  },
}

export { useToastOriginal as useToast } 