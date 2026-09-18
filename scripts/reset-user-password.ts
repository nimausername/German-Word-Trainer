import "dotenv/config";
import { getServiceAccountToken } from "../src/lib/keycloak";
import { getEnv } from "../src/lib/env";

/**
 * Usage: pnpm exec tsx scripts/reset-user-password.ts email@example.com 'YourPassword'
 */
const main = async () => {
  const email = process.argv[2]?.toLowerCase();
  const password = process.argv[3];
  if (!email || !password) {
    throw new Error(
      "Usage: pnpm exec tsx scripts/reset-user-password.ts <email> <password>",
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
  const users = (await usersResponse.json()) as Array<{ id: string }>;
  const userId = users[0]?.id;
  if (!userId) {
    throw new Error(`No user found for ${email}`);
  }

  const passwordResponse = await fetch(
    `${baseUrl}/admin/realms/${realm}/users/${userId}/reset-password`,
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
    throw new Error(`Reset failed: ${await passwordResponse.text()}`);
  }

  console.log(`Password reset for ${email}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
