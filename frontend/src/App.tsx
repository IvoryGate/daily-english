import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from '@/context/AuthContext'
import { UserDataProvider } from '@/context/UserDataContext'
import { AccountPage } from '@/components/AccountLayout'
import { AIChat } from '@/components/AIChat'
import { SiteHeader } from '@/components/SiteHeader'
import { ArticleDetailPage } from '@/pages/ArticleDetailPage'
import { ArticleListPage } from '@/pages/ArticleListPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { NewArticlePage } from '@/pages/NewArticlePage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ReviewPage } from '@/pages/ReviewPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { VocabularyPage } from '@/pages/VocabularyPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserDataProvider>
          <div className="min-h-screen bg-background">
            <SiteHeader />
            <AIChat />
            <Routes>
              {/* 前台：阅读内容 */}
              <Route path="/" element={<ArticleListPage />} />
              <Route path="/articles/:id" element={<ArticleDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* 个人中心（受保护，二级导航由 AccountLayout 提供） */}
              <Route path="/account" element={<AccountPage />}>
                <Route index element={<Navigate to="/account/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="vocabulary" element={<VocabularyPage />} />
                <Route path="review" element={<ReviewPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="new" element={<NewArticlePage />} />
              </Route>

              {/* 旧路径重定向 */}
              <Route path="/dashboard" element={<Navigate to="/account/dashboard" replace />} />
              <Route path="/vocabulary" element={<Navigate to="/account/vocabulary" replace />} />
              <Route path="/review" element={<Navigate to="/account/review" replace />} />
              <Route path="/settings" element={<Navigate to="/account/settings" replace />} />
              <Route path="/new" element={<Navigate to="/account/new" replace />} />
            </Routes>
          </div>
        </UserDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
