import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const DEV_USER = {
  email: "dev@subpar.local",
  name: "Dev User",
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Dev Login",
      credentials: {},
      async authorize() {
        // Find or create a dev user
        let user = await prisma.user.findUnique({
          where: { email: DEV_USER.email },
        });
        if (!user) {
          user = await prisma.user.create({
            data: DEV_USER,
          });
        }
        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
