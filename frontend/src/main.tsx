import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { SoundProvider } from './lib/SoundContext'
import { CrashBoundary } from './lib/CrashBoundary'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CrashBoundary>
      <QueryClientProvider client={queryClient}>
        <SoundProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </SoundProvider>
      </QueryClientProvider>
    </CrashBoundary>
  </React.StrictMode>,
)
