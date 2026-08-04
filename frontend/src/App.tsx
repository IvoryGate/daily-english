import { BrowserRouter, Route, Routes } from 'react-router'
import { SiteHeader } from '@/components/SiteHeader'
import { ArticleDetailPage } from '@/pages/ArticleDetailPage'
import { ArticleListPage } from '@/pages/ArticleListPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <Routes>
          <Route path="/" element={<ArticleListPage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
