import TodoApp from './TodoApp'
import { ThemeProvider } from './components/ThemeProvider'
import { ErrorBoundary } from './components/ErrorBoundary' // 新規追加

function App() {
  return (
    <ErrorBoundary> {/* エラー境界を追加 */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TodoApp />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App