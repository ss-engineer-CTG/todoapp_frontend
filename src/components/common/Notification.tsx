"use client"

import { AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export interface NotificationProps {
  title: string
  description: string
  type?: "success" | "error" | "warning" | "info"
}

export default function Notification({ title, description, type = "info" }: NotificationProps) {
  const iconMap = {
    success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <AlertTriangle className="h-4 w-4 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />
  }

  const bgColorMap = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200"
  }

  return (
    <Alert className={`${bgColorMap[type]} shadow-md`}>
      <div className="flex items-center gap-2">
        {iconMap[type]}
        <AlertTitle>{title}</AlertTitle>
      </div>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}