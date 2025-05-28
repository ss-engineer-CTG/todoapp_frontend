import TodoApp from './TodoApp'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TodoApp />
        </ThemeProvider>
      </body>
    </html>
  )
}

export default App