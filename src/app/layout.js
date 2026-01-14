import '@/styles/components/index.scss'
import '@/styles/globals.scss'
import '@/styles/layout/index.scss'
import '@/styles/modules/index.scss'

import { Inter } from 'next/font/google'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import AuthProvider from '@/providers/AuthProvider'
import LoaderListener from '@/providers/LoaderListener'
import StoreProvider from '@/providers/StoreProvider'
import ToastListener from '@/providers/ToastListener'
import { LanguageProvider } from '@/providers/languageContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'MyTube',
  description: 'Discover, watch, and share videos on MyTube',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <StoreProvider>
          <LanguageProvider>
            <AuthProvider />
            <ToastListener />
            <LoaderListener />
            {children}
            <ToastContainer position="bottom-right" />
          </LanguageProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
