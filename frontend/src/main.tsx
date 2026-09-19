import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

// Devtools chỉ có nghĩa khi đang phát triển. Import tĩnh thì trình gộp vẫn phải
// duyệt qua nó ở mỗi lần build production, còn nạp động sau một điều kiện
// `import.meta.env.DEV` thì nó bị loại hẳn khỏi bản phát hành.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools }))
    )
  : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        {ReactQueryDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
