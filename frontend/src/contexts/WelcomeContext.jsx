import React, { createContext, useContext, useState } from 'react'

const WelcomeContext = createContext()

export const WelcomeProvider = ({ children }) => {
  const [isWelcomeScreen, setIsWelcomeScreen] = useState(false)

  return (
    <WelcomeContext.Provider value={{ isWelcomeScreen, setIsWelcomeScreen }}>
      {children}
    </WelcomeContext.Provider>
  )
}

export const useWelcome = () => {
  const context = useContext(WelcomeContext)
  if (context === undefined) {
    throw new Error('useWelcome must be used within a WelcomeProvider')
  }
  return context
}
