import React, { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import App from './App.jsx'

const AdminDashboard = lazy(() => import('./components/AdminDashboard.jsx'))

export const createAppRouter = () => {
  return createBrowserRouter([
    {
      path: '/',
      element: <App />
    },
    {
      path: '/admin',
      element: (
        <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center"><div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>}>
          <AdminDashboard />
        </Suspense>
      )
    }
  ])
}
