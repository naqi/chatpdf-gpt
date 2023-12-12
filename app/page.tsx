// app/page.tsx
import PasswordPromptDialog from "@/components/password-prompt-dialog";
import React from "react";
import {cookies} from "next/headers";
import UploadDocuments from "@/app/upload-documents";

const Page = () => {
  const cookiesStore = cookies();
  const loginCookies = cookiesStore.get(process.env.NEXT_PUBLIC_PASSWORD_COOKIE_NAME!);
  const isLoggedIn = !!loginCookies?.value;

  if (!isLoggedIn) {
    return <PasswordPromptDialog />;
  } else {
    // User is authenticated, load data and render content
    return <UploadDocuments />
  }
}

export default Page;
