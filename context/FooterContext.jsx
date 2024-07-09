import React, { createContext, useContext, useState } from 'react';

export const FooterContext = createContext();

export function FooterProvider({ children }) {
  const [showFooter, setShowFooter] = useState(true);

  return (
    <FooterContext.Provider value={{ showFooter, setShowFooter }}>
      {children}
    </FooterContext.Provider>
  );
}