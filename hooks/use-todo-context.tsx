"use client"

import { useContext } from "react"
import { TodoContext } from "@/contexts/todo-context"

export const useTodoContext = () => {
  const context = useContext(TodoContext)
  if (context === undefined) {
    throw new Error("useTodoContext must be used within a TodoProvider")
  }
  return context
}