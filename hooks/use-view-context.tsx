"use client"

import { useContext } from "react"
import { ViewContext } from "@/contexts/view-context"

export const useViewContext = () => {
  const context = useContext(ViewContext)
  if (context === undefined) {
    throw new Error("useViewContext must be used within a ViewProvider")
  }
  return context
}