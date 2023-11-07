"use client"

import Link from "next/link"

import { siteConfig } from "@/config/site"
import { Button, buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useEffect, useState } from "react"
import { useAuthCookie } from "@/context/auth-context"

export function SiteHeader() {
  const { authCookieValue, removeAuthCookieValue } = useAuthCookie()
  const logoutHandler = () =>{
    removeAuthCookieValue()
  }
  useEffect(()=>{
  },[authCookieValue])
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <ThemeToggle />
            {!authCookieValue &&
            <Link href="/login">
            <Button>Login</Button>
            </Link>}
            {authCookieValue &&
            <Button onClick={() => logoutHandler()}>Logout</Button>
            }
          </nav>
        </div>
      </div>
    </header>
  )
}
