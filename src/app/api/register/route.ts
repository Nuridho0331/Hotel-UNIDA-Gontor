import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");
    const confirmPassword = String(
      body.confirmPassword ?? ""
    );

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        {
          message: "Nama, email, dan password wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        {
          message: "Format email tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          message: "Password minimal 8 karakter.",
        },
        {
          status: 400,
        }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          message: "Konfirmasi password tidak sama.",
        },
        {
          status: 400,
        }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "Email sudah terdaftar.",
        },
        {
          status: 409,
        }
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,

        // User yang daftar dari website SELALU USER.
        role: "USER",
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        message: "Akun berhasil dibuat.",
        user,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      {
        message: "Terjadi kesalahan saat membuat akun.",
      },
      {
        status: 500,
      }
    );
  }
}