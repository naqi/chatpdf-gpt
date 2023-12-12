// app/page.tsx
import PasswordPromptDialog from "@/components/PasswordPromptDialog";
import React from "react";
import {cookies} from "next/headers";
import UploadDocuments from "@/app/UploadDocuments";

const Page = () => {
  const cookiesStore = cookies();
  const loginCookies = cookiesStore.get(process.env.PASSWORD_COOKIE_NAME!);
  const isLoggedIn = !!loginCookies?.value;

  if (!isLoggedIn) {
    return <PasswordPromptDialog onSubmit={undefined} />;
  } else {
    // User is authenticated, load data and render content
    return <UploadDocuments />
  }
}

export default Page;
