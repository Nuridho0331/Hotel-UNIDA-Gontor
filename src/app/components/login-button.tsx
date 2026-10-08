"use client";

import { signIn } from "next-auth/react";
import { FaGoogle } from "react-icons/fa6";

export const LoginGoogleButton = () => {
  return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center justify-center gap-2 bg-amber-800 text-white font-medium py-3 px-6 text-base rounded-sm hover:bg-amber-900 cursor-pointer"
    >
      <FaGoogle className="size-6" />
      Sign in with Google
    </button>
  );
};