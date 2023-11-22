"use client"

import React, { useEffect, useReducer, useRef, useState } from "react"

// Import the main component

import jumpToPagePlugin from "@/components/documents/jumpToPagePlugin"

// Import the styles
import "@react-pdf-viewer/core/lib/styles/index.css"
import "@react-pdf-viewer/default-layout/lib/styles/index.css"
import "@react-pdf-viewer/highlight/lib/styles/index.css"
import rehypeKatex from "rehype-katex"
// @todo: add support for math expressions
import remarkGfm from "remark-gfm"
import RemarkMathPlugin from "remark-math"

// Import styles

import styles from "@/styles/Home.module.css"

import "katex/dist/katex.min.css"
// @ts-ignore
import Image from "next/image"
import { configurationValues } from "@/utils/auth"
import { Document } from "langchain/document"
import ReactMarkdown from "react-markdown"
import ScrollToBottom from "react-scroll-to-bottom"

import { Message, reducer } from "@/lib/chat"
import Spinner from "@/components/ui/Spinner"

const Page = () => {
  const cookieValue = configurationValues
  const [state, dispatch] = useReducer(reducer, {
    messages: [
      {
        name: "system",
        text: "Act as an expert. Reply to questions about this document. Self reflect on your answers.",
      },
    ],
    assistantThinking: false,
    isWriting: false,
    controller: null,
  })
  const [query, setQuery] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [messageState, setMessageState] = useState<{
    messages: Message[]
    pending?: string
    history: [string, string][]
    sourceDocs?: Document[]
  }>({
    messages: [
      {
        text: "Hi, what would you like to learn about this document?",
        name: "ai",
      },
    ],
    history: [],
  })

  const { messages, history } = messageState

  const messageListRef = useRef<HTMLDivElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textAreaRef.current?.focus()
  }, [])

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault()
    if (textAreaRef && textAreaRef.current) {
      const prompt = textAreaRef.current.value
      if (prompt !== "") {
        setQuery(prompt.trim())
        setError(null)

        if (!query) {
          alert("Please input a question")
          return
        }

        setLoading(true)
        const controller = new AbortController()
        const signal = controller.signal
        dispatch({ type: "addMessage", payload: { prompt, controller } })
        setQuery("")

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            signal: signal,
            body: JSON.stringify({
              ...cookieValue,
              prompt,
              messages: state.messages,
            }),
          })
          const data = res.body
          if (!data) {
            return
          }

          const reader = data.getReader()
          const decoder = new TextDecoder()
          let done = false

          while (!done) {
            const { value, done: doneReading } = await reader.read()
            done = doneReading

            const chunkValue = decoder.decode(value)
            dispatch({ type: "updatePromptAnswer", payload: chunkValue })
          }
          if (done) {
            dispatch({ type: "done" })
          }

          setLoading(false)

          //scroll to bottom
          messageListRef.current?.scrollTo(
            0,
            messageListRef.current.scrollHeight
          )
        } catch (error) {
          setLoading(false)
          setError(
            "An error occurred while fetching the data. Please try again."
          )
          console.log("\n\nCHAT_API_ERROR_FRONTEND\n\n", error, `\n\n`)
        }
      }
    }
  }

  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === "Enter" && query) {
      handleSubmit(e)
    } else if (e.key == "Enter") {
      e.preventDefault()
    }
  }

  return (
    <section className="container grid grid-cols-2 items-center gap-6 pb-8 pt-6 md:py-10">
      <h3 className="text-2xl font-bold leading-tight text-gray-900">
        Let&apos;s Chat
      </h3>
      <div className="max-w max-h col-span-2  flex flex-col justify-center rounded md:col-span-2">
        <div className="transition-width font-default relative mx-auto flex h-full w-full max-w-3xl flex-1 flex-col items-stretch overflow-hidden pb-12">
          <div className={styles.cloud}>
            <ScrollToBottom
              className="relative w-full h-full"
              scrollViewClassName="h-full w-full overflow-y-auto"
            >
              <div className="transition-width flex w-full flex-1 flex-col items-stretch">
                <div className="flex-1">
                  <div className="prose prose-lg prose-invert flex flex-col">
                    <div ref={messageListRef} className={styles.messagelist}>
                      {/* @ts-ignore */}
                      {state.messages &&
                        state.messages
                          .filter((message) => message["name"] != "system")
                          .map((message, index) => {
                            let icon
                            let className
                            if (message.name === "ai") {
                              icon = (
                                <Image
                                  key={index}
                                  src="/bot-image.png"
                                  alt="AI"
                                  width="40"
                                  height="40"
                                  className={styles.boticon}
                                  priority
                                />
                              )
                              className = styles.apimessage
                            } else {
                              icon = (
                                <Image
                                  key={index}
                                  src="/usericon.png"
                                  alt="Me"
                                  width="30"
                                  height="30"
                                  className={styles.usericon}
                                  priority
                                />
                              )
                              // The latest message sent by the user will be animated while waiting for a response
                              className =
                                loading && index === messages.length - 1
                                  ? styles.usermessagewaiting
                                  : styles.usermessage
                            }

                            return (
                              <>
                                <div
                                  key={`chatMessage-${index}`}
                                  className={className}
                                >
                                  {icon}
                                  <div className={styles.markdownanswer}>
                                    <ReactMarkdown
                                      className="prose prose-lg"
                                      remarkPlugins={[
                                        remarkGfm,
                                        RemarkMathPlugin,
                                      ]}
                                      rehypePlugins={[rehypeKatex]}
                                      linkTarget="_blank"
                                    >
                                      {message.text}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              </>
                            )
                          })}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollToBottom>
          </div>
          <div className={styles.center}>
            <div className={styles.cloudform}>
              <form onSubmit={handleSubmit}>
                <textarea
                  disabled={loading}
                  onKeyDown={handleEnter}
                  ref={textAreaRef}
                  autoFocus={false}
                  rows={1}
                  maxLength={512}
                  id="userInput"
                  name="userInput"
                  placeholder={
                    loading
                      ? "Waiting for response..."
                      : "Suggest some solid for one year old kid"
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={styles.textarea}
                />
                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleSubmit}
                  className={styles.generatebutton}
                >
                  {loading ? (
                    <div className={styles.loadingwheel}>
                      <Spinner cx="animate-spin w-5 h-5 text-gray-400" />
                    </div>
                  ) : (
                    // Send icon SVG in input field
                    <svg
                      viewBox="0 0 20 20"
                      className={styles.svgicon}
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
          {error && (
            <div className="rounded-md border border-red-400 p-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Page
