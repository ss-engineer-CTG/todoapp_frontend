import TodoApp from './TodoApp'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TodoApp />
    </ThemeProvider>
  )
}

export default App