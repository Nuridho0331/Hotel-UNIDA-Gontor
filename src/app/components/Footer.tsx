import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-[#f7f4ef] text-[#1d1b18]">
      {/* HERO */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <img
          src="/IMG_0334.JPG"
          alt="Hotel UNIDA Gontor"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/40" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl items-end px-6 pb-16 pt-32 lg:px-10 lg:pb-20">
          <div className="max-w-4xl">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/70">
              Hotel UNIDA Gontor
            </p>

            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.03] tracking-[-0.035em] text-white md:text-7xl">
              Welcome to
              <br />
              Hotel UNIDA Gontor
            </h1>

            <p className="mt-6 text-base font-medium text-white/85 md:text-lg">
              Berbasis Wakaf, Bernuansa Islami
            </p>

            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/55">
              Meeting · Incentives · Conferences · Exhibitions
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/rooms"
                className="bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
              >
                Lihat Kamar
              </Link>

              <Link
                href="/contact"
                className="border border-white/45 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8a5a2b]">
              Room Catalog
            </p>

            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">
              Pilihan kamar untuk kebutuhan menginap Anda.
            </h2>
          </div>

          <div>
            <p className="max-w-xl text-base leading-7 text-neutral-600">
              Hotel UNIDA Gontor menyediakan beberapa pilihan kamar,
              mulai dari Executive Rooms, Deluxe Rooms, Family Rooms,
              hingga Hostel Rooms.
            </p>

            <Link
              href="/rooms"
              className="mt-6 inline-flex items-center gap-2 border-b border-neutral-900 pb-1 text-sm font-medium"
            >
              Lihat semua kamar
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ROOM FEATURE */}
      <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          {/* EXECUTIVE */}
          <Link
            href="/rooms"
            className="group relative min-h-[560px] overflow-hidden bg-neutral-200"
          >
            <img
              src="/IMG_0340.JPG"
              alt="Executive Room Hotel UNIDA Gontor"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
            />

            <div className="absolute inset-0 bg-black/15" />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-8 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-white/65">
                Executive Rooms
              </p>

              <div className="mt-2 flex items-end justify-between gap-5">
                <h3 className="text-3xl font-semibold">
                  VIP Rooms
                </h3>

                <span className="text-xl transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </div>
          </Link>

          {/* RIGHT */}
          <div className="grid gap-5">
            <Link
              href="/rooms"
              className="group relative min-h-[270px] overflow-hidden bg-neutral-200"
            >
              <img
                src="/IMG_0334.JPG"
                alt="Deluxe Room Hotel UNIDA Gontor"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">
                  Deluxe Rooms
                </p>

                <div className="mt-2 flex items-end justify-between">
                  <h3 className="text-2xl font-semibold">
                    Triple & Twin Deluxe
                  </h3>

                  <span className="text-lg transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>

            <Link
              href="/rooms"
              className="group relative min-h-[270px] overflow-hidden bg-neutral-200"
            >
              <img
                src="/IMG_0340.JPG"
                alt="Family Room Hotel UNIDA Gontor"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">
                  Family Rooms
                </p>

                <div className="mt-2 flex items-end justify-between">
                  <h3 className="text-2xl font-semibold">
                    Classic & Superior Family
                  </h3>

                  <span className="text-lg transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-0 bg-[#1d2b3f] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_0.9fr]">
            {/* LOGO */}
            <div>
              <img
                src="/logonama.png"
                alt="Hotel UNIDA Gontor"
                className="h-auto w-[300px] max-w-full"
              />
            </div>

            {/* MENU */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">
                Menu
              </h3>

              <ul className="mt-5 space-y-3 text-sm text-white/75">
                <li>
                  <Link href="/" className="transition hover:text-white">
                    Home
                  </Link>
                </li>

                <li>
                  <Link href="/about" className="transition hover:text-white">
                    About
                  </Link>
                </li>

                <li>
                  <Link href="/rooms" className="transition hover:text-white">
                    Rooms
                  </Link>
                </li>

                <li>
                  <Link href="/contact" className="transition hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* INFORMATION */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">
                Information
              </h3>

              <ul className="mt-5 space-y-3 text-sm text-white/75">
                <li>
                  <a href="#" className="transition hover:text-white">
                    Terms & Conditions
                  </a>
                </li>

                <li>
                  <a href="#" className="transition hover:text-white">
                    Privacy Policy
                  </a>
                </li>

                <li>
                  <a href="#" className="transition hover:text-white">
                    Payment Methods
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* COPYRIGHT */}
          <div className="mt-10 border-t border-white/10 pt-5">
            <p className="text-xs text-white/45">
              © {new Date().getFullYear()} Hotel UNIDA Gontor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}