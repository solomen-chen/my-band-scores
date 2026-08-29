// app/layout.js

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast'; // 1. 導入 Toaster

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL("https://my-band-scores.vercel.app"),
  title: "斗南長老教會樂譜檢索 | 斗南教會聖歌隊詩歌樂譜查詢",
  description:
    "斗南長老教會樂譜檢索系統，提供斗南教會聖歌隊詩歌樂譜線上查詢與管理，快速找到需要的詩歌樂譜。",
  keywords: ["斗南教會", "斗南長老教會", "斗南教會樂譜", "斗南教會聖歌隊", "樂譜檢索"],
  openGraph: {
    title: "斗南長老教會樂譜檢索",
    description: "斗南教會聖歌隊詩歌樂譜線上查詢系統",
    url: "https://my-band-scores.vercel.app",
    siteName: "斗南長老教會樂譜檢索",
    locale: "zh_TW",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Church",
              name: "斗南長老教會",
              alternateName: "斗南教會",
              url: "https://my-band-scores.vercel.app",
            }),
          }}
        />
        <Toaster 
          position="top-center" // 顯示在頂部中間
          reverseOrder={false}
          toastOptions={{
            // 定義通用的樣式
            style: {
              background: '#333',
              color: '#fff',
            },
            // 定義成功和錯誤的預設樣式
            success: {
              duration: 3000,
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
            error: {
              duration: 5000, // 錯誤訊息顯示久一點
            },
          }}
        />
        
        {children}
      </body>
    </html>
  );
}