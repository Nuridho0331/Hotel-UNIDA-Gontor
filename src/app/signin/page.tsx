"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const registered =
    searchParams.get("registered") === "true";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const email = String(
      formData.get("email") ?? ""
    );

    const password = String(
      formData.get("password") ?? ""
    );

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError(
        "Terjadi kesalahan saat login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">

        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900">
            Selamat Datang
          </h1>

          <p className="text-neutral-500 mt-2">
            Masuk ke akun Hotel UNIDA Gontor.
          </p>
        </div>

        {registered && (
          <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Akun berhasil dibuat. Silakan masuk.
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email
            </label>

            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-amber-800"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Password
            </label>

            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-amber-800"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-900 text-white py-3 font-medium hover:bg-amber-950 transition disabled:opacity-60 cursor-pointer"
          >
            {loading
              ? "Masuk..."
              : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-medium text-amber-900 hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </main>
  );
}