import "dotenv/config";
import { getServiceAccountToken } from "../src/lib/keycloak";
import { getEnv } from "../src/lib/env";

const main = async () => {
  const email = (process.argv[2] ?? "").toLowerCase();
  if (!email) {
    throw new Error("Usage: pnpm exec tsx scripts/inspect-user-flags.ts <email>");
  }

  const env = getEnv();
  const realm = env.KEYCLOAK_ISSUER.split("/realms/")[1]!;
  const baseUrl = env.KEYCLOAK_ISSUER.replace(`/realms/${realm}`, "");
  const token = await getServiceAccountToken();
  const usersRes = await fetch(
    `${baseUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const users = (await usersRes.json()) as Array<{
    id: string;
    enabled?: boolean;
    emailVerified?: boolean;
    requiredActions?: string[];
    firstName?: string;
    lastName?: string;
  }>;
  const user = users[0];
  if (!user) {
    console.log({ found: false });
    return;
  }

  const credsRes = await fetch(
    `${baseUrl}/admin/realms/${realm}/users/${user.id}/credentials`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const creds = (await credsRes.json()) as Array<{
    type?: string;
    temporary?: boolean;
    userLabel?: string;
  }>;

  console.log({
    found: true,
    enabled: user.enabled,
    emailVerified: user.emailVerified,
    requiredActions: user.requiredActions ?? [],
    hasFirstName: Boolean(user.firstName),
    hasLastName: Boolean(user.lastName),
    credentialCount: creds.length,
    credentials: creds.map((credential) => ({
      type: credential.type,
      temporary: credential.temporary ?? false,
    })),
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
