
"use client";

import { IoClose, IoMenu } from "react-icons/io5";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function Navlink() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "ADMIN";
  const isUser = session?.user?.role === "USER";

  const closeMenu = () => setIsOpen(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/rooms", label: "Rooms" },
    { href: "/contact", label: "Contact" },
  ];

  if (isUser) {
    links.push({
      href: "/my-reservation",
      label: "My Reservation",
    });
  }

  if (isAdmin) {
    links.push(
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/rooms", label: "Kelola Kamar" },
      { href: "/admin/reservations", label: "Reservasi" }
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Buka menu"
        aria-expanded={isOpen}
        className="rounded-lg p-2 text-neutral-700 lg:hidden"
      >
        {isOpen ? (
          <IoClose className="h-7 w-7" />
        ) : (
          <IoMenu className="h-7 w-7" />
        )}
      </button>

      <div
        className={`${
          isOpen ? "block" : "hidden"
        } absolute left-0 right-0 top-full border-t bg-white shadow-md lg:static lg:block lg:border-0 lg:shadow-none`}
      >
        <ul className="flex flex-col gap-2 p-5 lg:flex-row lg:items-center lg:gap-4 lg:p-0 xl:gap-6">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={closeMenu}
                className="block whitespace-nowrap py-2 text-xs font-semibold uppercase text-neutral-700 transition hover:text-amber-800"
              >
                {link.label}
              </Link>
            </li>
          ))}

          {session ? (
            <li className="flex items-center gap-3 lg:ml-2">
              <Image
                src={session.user.image || "/orang.svg"}
                alt="Avatar pengguna"
                width={36}
                height={36}
                className="rounded-full object-cover"
              />

              <button
                type="button"
                onClick={() =>
                  signOut({ callbackUrl: "/signin" })
                }
                className="whitespace-nowrap rounded-lg bg-neutral-100 px-4 py-2 text-xs font-semibold hover:bg-neutral-200"
              >
                Sign Out
              </button>
            </li>
          ) : (
            <li>
              <Link
                href="/signin"
                onClick={closeMenu}
                className="block whitespace-nowrap rounded-lg bg-amber-900 px-5 py-2 text-center text-xs font-semibold text-white"
              >
                Sign In
              </Link>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
