import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/common/theme-provider"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "統合ToDo管理アプリ",
  description: "階層型リスト表示とタイムライン表示を統合したプロジェクト・タスク管理アプリケーション",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}