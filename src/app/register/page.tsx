"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Pendaftaran gagal.");
        return;
      }

      router.push("/signin?registered=true");
    } catch {
      setError("Terjadi kesalahan. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900">
            Buat Akun
          </h1>

          <p className="text-neutral-500 mt-2">
            Daftar untuk melakukan reservasi kamar Hotel UNIDA Gontor.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Nama Lengkap
            </label>

            <input
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-amber-800"
              placeholder="Nama lengkap"
            />
          </div>

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
              Nomor WhatsApp
            </label>

            <input
              name="phone"
              type="tel"
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-amber-800"
              placeholder="08xxxxxxxxxx"
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
              minLength={8}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-amber-800"
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Konfirmasi Password
            </label>

            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-amber-800"
              placeholder="Ulangi password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-900 text-white py-3 font-medium hover:bg-amber-950 transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Membuat akun..." : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Sudah punya akun?{" "}
          <Link
            href="/signin"
            className="font-medium text-amber-900 hover:underline"
          >
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}