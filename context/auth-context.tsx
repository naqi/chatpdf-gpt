'use client';
import { createContext, useContext, useEffect, useState } from "react"
// import { cookies } from 'next/headers' // @todo: refactor to use this
import cookies from "js-cookie"

const auth_cookie_key = "auth"

const AuthCookieContext = createContext({
  authCookieValue: null,
  setAndSaveAuthCookieValue: null,
  removeAuthCookieValue: null
})

// Sorry for the mess, I'm in a hurry
export function AuthCookieProvider({ children }) {
  const [authCookieValue, setCookieValue] = useState(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setCookieForInitialNonEmptyValue = () => {
    // set cookie for key with a value in cookieValue
    const nonEmptCookieValue = {}
    for (const [key, value] of Object.entries(authCookieValue)) {
      if (value) {
        nonEmptCookieValue[key] = value
      }
    }
    // check if nonEmptCookieValue is empty
    if (Object.keys(nonEmptCookieValue).length > 0) {
      cookies.set(auth_cookie_key, JSON.stringify(nonEmptCookieValue), { expires: 1 })
    }
  }

  useEffect(() => {
    if (authCookieValue) {
      setCookieForInitialNonEmptyValue()
    }
  }
    , [authCookieValue, setCookieForInitialNonEmptyValue])

  useEffect(() => {
    const valuesFromCookie = cookies.get(auth_cookie_key)

    if (valuesFromCookie) {
      setCookieValue(JSON.parse(valuesFromCookie))
    }
  }, [])

  const setAndSaveAuthCookieValue = (value) => {
    cookies.set(auth_cookie_key, JSON.stringify(value), { expires: 1 })
    setCookieValue(value)
  }

  const removeAuthCookieValue = () => {
    cookies.remove(auth_cookie_key)
    setCookieValue(null)
  }
  return (
    <AuthCookieContext.Provider
      value={{ authCookieValue, setAndSaveAuthCookieValue, removeAuthCookieValue }}
    >
      {children}
    </AuthCookieContext.Provider>
  )
}

export function useAuthCookie() {
  return useContext(AuthCookieContext)
}
