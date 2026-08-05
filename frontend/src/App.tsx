import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '@/context/AuthContext'
import { UserDataProvider } from '@/context/UserDataContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
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
            <Routes>
              <Route path="/" element={<ArticleListPage />} />
              <Route path="/articles/:id" element={<ArticleDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/vocabulary"
                element={
                  <ProtectedRoute>
                    <VocabularyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/review"
                element={
                  <ProtectedRoute>
                    <ReviewPage />
                  </ProtectedRoute>
                }
              />
            <Route path="/new" element={<NewArticlePage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            </Routes>
          </div>
        </UserDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
