import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { sekolah: true },
        });

        if (!user) {
          throw new Error("Email tidak ditemukan");
        }

        if (!user.aktif) {
          throw new Error("Akun tidak aktif. Hubungi administrator");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nama,
          role: user.role,
          sekolahId: user.sekolahId ?? undefined,
          sekolahNama: user.sekolah?.nama ?? undefined,
          nip: user.nip ?? undefined,
          jabatan: user.jabatan ?? undefined,
          avatar: user.avatar ?? undefined,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; role: string; sekolahId?: string; sekolahNama?: string; nip?: string; jabatan?: string; avatar?: string };
        token.id = u.id;
        token.role = u.role;
        token.sekolahId = u.sekolahId;
        token.sekolahNama = u.sekolahNama;
        token.nip = u.nip;
        token.jabatan = u.jabatan;
        token.avatar = u.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.sekolahId = token.sekolahId as string | undefined;
        session.user.sekolahNama = token.sekolahNama as string | undefined;
        session.user.nip = token.nip as string | undefined;
        session.user.jabatan = token.jabatan as string | undefined;
        session.user.avatar = token.avatar as string | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 jam
  },

  secret: process.env.NEXTAUTH_SECRET,
};
