// app/page.tsx
import PasswordPromptDialog from "@/components/PasswordPromptDialog";
import React from "react";
import {cookies} from "next/headers";
import Documents from "@/app/documents/documents";

const Page = () => {
  const cookiesStore = cookies();
  const loginCookies = cookiesStore.get(process.env.NEXT_PUBLIC_PASSWORD_COOKIE_NAME!);
  const isLoggedIn = !!loginCookies?.value;

  if (!isLoggedIn) {
    return <PasswordPromptDialog />;
  } else {
    // User is authenticated, load data and render content
    return <Documents />
  }
}

export default Page;
