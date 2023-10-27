"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useCredentialsCookie } from "@/context/credentials-context"
import { AlertCircle, Check, Loader2, UploadCloud } from "lucide-react"
import { useDropzone } from "react-dropzone"
// import { useDropzone } from 'react-dropzone';
import useSWR, { useSWRConfig } from "swr"

import { uploadToSubabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DocumentsTable } from "@/components/documents/table"
import { useAuthCookie } from "@/context/auth-context"
import { configurationValues } from "@/utils/auth"
// @ts-ignore
const fetcher = (...args: any) => fetch(...args).then((res) => res.json())

export default function Page() {
  const {authCookieValue } = useAuthCookie()
  const { data } = useSWR(["/api/documents"], fetcher)
  const [files, setFiles] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState<boolean>(false)
  const [canUpload, setCanUpload] = useState(false)
  
  const cookieValue  = configurationValues
  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles)
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // @todo: add support for multiple files
    maxFiles: 100,
    accept: {
      "application/pdf": [".pdf"],
    },
  })
  useEffect(() => {
    const fetchDocuments = async () => {
      if (data) {
        setDocuments(data.data)
      }
    }
    fetchDocuments()
  }, [data])

  const ButtonLoading = () => {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Please wait
      </Button>
    )
  }

  const uploadFiles = async () => {
    setLoading(true)
    try {
      const allFileUploads = []
      for (const file of files) {
        const uploadData: any = await uploadToSubabase(
          file,
          cookieValue.supabaseUrl,
          cookieValue.supabaseKey,
          cookieValue.supabaseBucket
        )
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authCookieValue.AccessToken
          },
          body: JSON.stringify({
            url: uploadData.path,
            // @ts-ignore
            name: file.name,
            // Add any other associated data here
            // ...cookieValue,
          }),
        })
        allFileUploads.push(allFileUploads)
      }

      Promise.resolve(allFileUploads).then((res) => {
        setLoading(false)
      })

      // navigate to the new document page
      // setDocument(data);
      return {} // Here you can return the data you get from the server if you wish
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <section className="container  grid h-full items-center gap-6 pb-8 pt-6">
      {!authCookieValue && (
        <h2 className="mt-10 scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0">
          Please Login to access Documents!
        </h2>
      )}
      {authCookieValue && (
        <>
          <div className="min-w-1/5 col-span-2 flex flex-col items-start gap-2 md:col-span-1">
            <h2 className="mt-10 scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0">
              Upload your PDF
            </h2>
            <div
              className="min-w-full rounded-md border border-slate-200 p-0 dark:border-slate-700"
              {...getRootProps()}
            >
              <div className="flex min-h-[150px] cursor-pointer items-center justify-center p-10">
                <input {...getInputProps()} />

                {files ? (
                  <ul>
                    {files.map((file) => (
                      <li key={file.name}>* {file.name}</li>
                    ))}
                  </ul>
                ) : (
                  <>
                    {isDragActive ? (
                      <p>Drop your PDF here ...</p>
                    ) : (
                      <p>
                        Drag and drop your PDF here, or click to select file
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="self-start">
              {loading ? (
                <ButtonLoading />
              ) : (
                <Button
                  type="submit"
                  disabled={
                    !files ||
                    loading ||
                    !cookieValue.openaiApiKey ||
                    !cookieValue.pineconeEnvironment ||
                    !cookieValue.pineconeIndex ||
                    !cookieValue.pineconeApiKey ||
                    !cookieValue.supabaseUrl ||
                    !cookieValue.supabaseKey ||
                    !cookieValue.supabaseBucket ||
                    !cookieValue.supabaseDatabaseUrl ||
                    !cookieValue.supabaseDirectUrl
                  }
                  className="mt-2"
                  onClick={uploadFiles}
                >
                  {!canUpload && <UploadCloud className="mr-2 h-4 w-4" />}
                  {canUpload && <Check className="mr-2 h-4 w-4" />}
                  Upload Document
                </Button>
              )}
            </div>
          </div>
          <h3 className="text-2xl font-bold leading-tight text-gray-900">
            Documents
          </h3>
          <DocumentsTable documents={documents} setDocuments={setDocuments} />
        </>
      )}
    </section>
  )
}
