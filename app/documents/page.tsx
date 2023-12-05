'use client';
import React, { useEffect, useState } from 'react';
// import { useDropzone } from 'react-dropzone';
import useSWR, { useSWRConfig } from 'swr'
import { DocumentsTable } from '@/components/documents/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useCredentialsCookie } from '@/context/credentials-context';
import Link from 'next/link';

// @ts-ignore
const fetcher = (...args: any) => fetch(...args).then(res => res.json())


export default function Page() {
  const { data } = useSWR('/api/documents', fetcher)
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (data) {
        setDocuments(data.data);
      }
    };
    fetchDocuments();
  }, [data]);
    // checks if credentials are set

  return (
    <section className="container  grid h-full items-center gap-6 pb-8 pt-6">
        <h3 className="text-2xl font-bold leading-tight text-gray-900">
            Documents
        </h3>
      <DocumentsTable documents={documents} setDocuments={setDocuments} />
    </section>
  );
}
