import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Inter, Poppins } from 'next/font/google'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { ThemeProvider } from '../contexts/ThemeContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AutoPost - Modern Social Media Dashboard',
  description: 'Automate your Facebook posts with scheduling - Modern, intuitive interface for social media management',
  keywords: 'Facebook, automation, posts, scheduling, social media, dashboard',
  authors: [{ name: 'AutoPost Team' }],
  creator: 'AutoPost',
  publisher: 'AutoPost',
  robots: 'index, follow',
  openGraph: {
    title: 'AutoPost - Modern Social Media Dashboard',
    description: 'Automate your Facebook posts with scheduling',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoPost - Modern Social Media Dashboard',
    description: 'Automate your Facebook posts with scheduling',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin=""
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen antialiased bg-gray-50 dark:bg-gray-950" suppressHydrationWarning>
        <ThemeProvider>
          <div className="flex w-full min-h-screen">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content Wrapper */}
            <div className="flex flex-col flex-1 w-full min-h-screen">
              {/* Navbar */}
              <Navbar />
              
              {/* Page Content */}
              <main className="flex-1 w-full overflow-y-auto bg-inherit">
                <div className="w-full px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                  {children}
                </div>
              </main>
            </div>
          </div>
          
          {/* Toast Notifications Container */}
          <div id="toast-root" />
        </ThemeProvider>
      </body>
    </html>
  )
}