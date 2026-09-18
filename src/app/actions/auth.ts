"use server";

import { signOut } from "@/auth";

/**
 * Ends the Auth.js session and returns the user to sign-in.
 */
export const signOutAction = async () => {
  await signOut({ redirectTo: "/sign-in" });
};
