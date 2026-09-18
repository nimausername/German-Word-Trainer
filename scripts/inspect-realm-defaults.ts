import "dotenv/config";
import { getServiceAccountToken } from "../src/lib/keycloak";
import { getEnv } from "../src/lib/env";

const main = async () => {
  const env = getEnv();
  const realm = env.KEYCLOAK_ISSUER.split("/realms/")[1]!;
  const baseUrl = env.KEYCLOAK_ISSUER.replace(`/realms/${realm}`, "");
  const token = await getServiceAccountToken();

  const realmRes = await fetch(`${baseUrl}/admin/realms/${realm}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const realmJson = (await realmRes.json()) as {
    registrationEmailAsUsername?: boolean;
    verifyEmail?: boolean;
    loginWithEmailAllowed?: boolean;
    duplicateEmailsAllowed?: boolean;
    requiredActions?: unknown;
  };

  const requiredActionsRes = await fetch(
    `${baseUrl}/admin/realms/${realm}/authentication/required-actions`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const requiredActions = (await requiredActionsRes.json()) as Array<{
    alias?: string;
    enabled?: boolean;
    defaultAction?: boolean;
    name?: string;
  }>;

  console.log({
    verifyEmail: realmJson.verifyEmail,
    loginWithEmailAllowed: realmJson.loginWithEmailAllowed,
    registrationEmailAsUsername: realmJson.registrationEmailAsUsername,
    defaultRequiredActions: requiredActions
      .filter((action) => action.defaultAction)
      .map((action) => ({
        alias: action.alias,
        enabled: action.enabled,
      })),
    enabledRequiredActions: requiredActions
      .filter((action) => action.enabled)
      .map((action) => action.alias),
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
