import { useState } from 'react'
import { mockArticles } from '@/lib/mockArticles'
import { ArticleDetailPage } from '@/pages/ArticleDetailPage'
import { ArticleListPage } from '@/pages/ArticleListPage'

function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const article = mockArticles.find((item) => item.id === selectedId) ?? null

  if (article) {
    return (
      <ArticleDetailPage article={article} onBack={() => setSelectedId(null)} />
    )
  }

  return <ArticleListPage onSelect={setSelectedId} />
}

export default App
