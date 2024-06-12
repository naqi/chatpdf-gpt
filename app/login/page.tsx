"use client"

import React, { useEffect, useState } from "react"
import Head from "next/head"
import { useAuthCookie } from "@/context/auth-context"
import {
  AdminInitiateAuthCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation";

// ES Modules import
// const { CognitoIdentityProviderClient, InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider"); // CommonJS import
const client = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_COGNITO_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_COGNITO_PUBLIC_KEY,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_COGNITO_SECRET_KEY,
  },
  maxAttempts: 3,
})

export default function LoginPage() {
  const [username, setUsername] = useState(null)
  const [password, setPassword] = useState(null)
  const [error, setError] = useState<string | null>(null)
  const { authCookieValue, setAndSaveAuthCookieValue } = useAuthCookie()
  const router = useRouter();

  useEffect(()=> {
    if(authCookieValue){
      router.push('/')
    }
  })
  const handleUsernameChange = (e) => {
    setError(null)
    setUsername(e.target.value)
  }
  const handlePasswordChange = (e) => {
    setError(null)
    setPassword(e.target.value)
  }

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both Username and Password.")
    } else {
      const input = {
        // InitiateAuthRequest
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
        ClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID,
        UserPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID,
      }
      const command = new AdminInitiateAuthCommand(input)
      try {
        const response = await client.send(command)
        setAndSaveAuthCookieValue({
          AccessToken: response.AuthenticationResult.AccessToken,
        })
      } catch (error) {
        setError(
          error.message
            ? error.message
            : "Something went wrong, please try again."
        )
      }
    }
  }

  return (
    <>
      <Head>
        <title>Login</title>
        <meta name="description" content="Add credentials" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className="container flex justify-items-center gap-6 pb-8 pt-6 md:py-10">
        <div className="flex flex-col items-center justify-center gap-2 ">
          <div className="grid gap-4 py-4">
            <h2 className="mt-10 scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0">
              Login
            </h2>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                placeholder="Enter username"
                className="col-span-3"
                onChange={handleUsernameChange}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                placeholder="Enter Password"
                className="col-span-3"
                onChange={handlePasswordChange}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-400 p-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}
            <Button onClick={handleLogin}>Login</Button>
          </div>
        </div>
      </section>
    </>
  )
}
