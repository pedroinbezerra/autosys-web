'use client'

import './globals.css'
import './Typeahead.css'
import { Inter } from 'next/font/google'
import "bootstrap/dist/css/bootstrap.min.css";
import { UserProvider } from '../../context/UserContext'
import { ServiceProvider } from '../../context/ServiceContext'
import { VehicleProvider } from '../../context/VehicleContext'
import { ClientProvider } from '../../context/ClientContext'
import { CompanyProvider } from '../../context/CompanyContext'
import { ApiProvider } from '../../context/ApiContext'
import { WelcomeProvider } from '../../context/WelcomeContext'
import { FooterProvider, FooterContext } from '../../context/FooterContext'
import Footer from '../../components/Footer';
import { useContext } from 'react';

const inter = Inter({ subsets: ['latin'] })
const title = 'Autosys'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ServiceProvider>
        <VehicleProvider>
          <ClientProvider>
            <CompanyProvider>
              <ApiProvider>
                <WelcomeProvider>
                  <FooterProvider>
                    <html lang='pt-br'>
                      <head>
                        <title>{title}</title>
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                      </head>
                      <body className={inter.className}>
                        <div className="app-wrapper">
                          <div className="content-wrapper">
                            {children}
                          </div>
                          <Footer />
                        </div>
                      </body>
                    </html>
                  </FooterProvider>
                </WelcomeProvider>
              </ApiProvider>
            </CompanyProvider>
          </ClientProvider>
        </VehicleProvider>
      </ServiceProvider>
    </UserProvider>
  )
}
