import { BrowserRouter, Route, Routes } from 'react-router'
import { SiteHeader } from '@/components/SiteHeader'
import { ArticleDetailPage } from '@/pages/ArticleDetailPage'
import { ArticleListPage } from '@/pages/ArticleListPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NewArticlePage } from '@/pages/NewArticlePage'
import { ReviewPage } from '@/pages/ReviewPage'
import { VocabularyPage } from '@/pages/VocabularyPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <Routes>
          <Route path="/" element={<ArticleListPage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/new" element={<NewArticlePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
