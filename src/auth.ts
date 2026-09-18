import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import {
  decodeJwtPayload,
  passwordGrant,
} from "@/lib/keycloak";
import { getEnv } from "@/lib/env";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse({
          email:
            typeof credentials?.email === "string"
              ? credentials.email.trim().toLowerCase()
              : credentials?.email,
          password: credentials?.password,
        });
        if (!parsed.success) {
          return null;
        }

        try {
          getEnv();
          const tokens = await passwordGrant(
            parsed.data.email,
            parsed.data.password,
          );
          const payload = decodeJwtPayload<{
            sub: string;
            email?: string;
            preferred_username?: string;
            name?: string;
          }>(tokens.access_token);

          if (!payload.sub) {
            return null;
          }

          return {
            id: payload.sub,
            email: payload.email ?? parsed.data.email,
            name:
              payload.name ?? payload.preferred_username ?? parsed.data.email,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          };
        } catch (error) {
          console.error("[auth] password grant failed", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.accessToken = (
          user as { accessToken?: string }
        ).accessToken;
        token.refreshToken = (
          user as { refreshToken?: string }
        ).refreshToken;
      }

      if (trigger === "update" && session) {
        const nextName =
          typeof session.name === "string"
            ? session.name
            : typeof session.user?.name === "string"
              ? session.user.name
              : null;
        if (nextName !== null) {
          token.name = nextName;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: String(token.sub ?? ""),
          email: typeof token.email === "string" ? token.email : null,
          name: typeof token.name === "string" ? token.name : null,
        },
      };
    },
  },
});
