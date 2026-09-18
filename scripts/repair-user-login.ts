import "dotenv/config";
import { getServiceAccountToken, passwordGrant } from "../src/lib/keycloak";
import { getEnv } from "../src/lib/env";

/**
 * Clears Keycloak required actions that block password grant
 * ("Account is not fully set up").
 *
 * Usage:
 *   pnpm exec tsx scripts/repair-user-login.ts email@example.com
 *   pnpm exec tsx scripts/repair-user-login.ts email@example.com 'OptionalNewPassword'
 */
const main = async () => {
  const email = process.argv[2]?.toLowerCase();
  const password = process.argv[3];
  if (!email) {
    throw new Error(
      "Usage: pnpm exec tsx scripts/repair-user-login.ts <email> [password]",
    );
  }

  const env = getEnv();
  const realm = env.KEYCLOAK_ISSUER.split("/realms/")[1]!;
  const baseUrl = env.KEYCLOAK_ISSUER.replace(`/realms/${realm}`, "");
  const token = await getServiceAccountToken();

  const usersResponse = await fetch(
    `${baseUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!usersResponse.ok) {
    throw new Error(`Lookup failed: ${await usersResponse.text()}`);
  }
  const users = (await usersResponse.json()) as Array<{
    id: string;
    requiredActions?: string[];
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    enabled?: boolean;
    emailVerified?: boolean;
  }>;
  const user = users[0];
  if (!user?.id) {
    throw new Error(`No user found for ${email}`);
  }

  console.log("before requiredActions:", user.requiredActions ?? []);

  if (password) {
    const passwordResponse = await fetch(
      `${baseUrl}/admin/realms/${realm}/users/${user.id}/reset-password`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "password",
          value: password,
          temporary: false,
        }),
      },
    );
    if (!passwordResponse.ok) {
      throw new Error(`Reset password failed: ${await passwordResponse.text()}`);
    }
  }

  const updateResponse = await fetch(
    `${baseUrl}/admin/realms/${realm}/users/${user.id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...user,
        enabled: true,
        emailVerified: true,
        requiredActions: [],
        firstName: user.firstName || email.split("@")[0],
        lastName: user.lastName || "-",
      }),
    },
  );
  if (!updateResponse.ok) {
    throw new Error(`Clear actions failed: ${await updateResponse.text()}`);
  }

  if (password) {
    const tokens = await passwordGrant(email, password);
    console.log("password grant OK", Boolean(tokens.access_token));
  }

  console.log(`Repaired login for ${email}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
