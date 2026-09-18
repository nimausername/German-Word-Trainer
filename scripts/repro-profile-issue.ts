import "dotenv/config";
import { getServiceAccountToken, passwordGrant } from "../src/lib/keycloak";
import { getEnv } from "../src/lib/env";

/**
 * Reproduces Keycloak "Account is not fully set up" when profile fields are incomplete.
 */
const main = async () => {
  const env = getEnv();
  const realm = env.KEYCLOAK_ISSUER.split("/realms/")[1]!;
  const baseUrl = env.KEYCLOAK_ISSUER.replace(`/realms/${realm}`, "");
  const token = await getServiceAccountToken();
  const email = `profile-${Date.now()}@example.com`;
  const password = "TestPass123!";

  const createRes = await fetch(`${baseUrl}/admin/realms/${realm}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: email,
      email,
      enabled: true,
      emailVerified: true,
      requiredActions: [],
      firstName: "Mina",
      // intentionally omit lastName
    }),
  });
  if (!createRes.ok) {
    throw new Error(await createRes.text());
  }
  const userId = createRes.headers.get("Location")?.split("/").pop();
  if (!userId) {
    throw new Error("missing user id");
  }

  await fetch(`${baseUrl}/admin/realms/${realm}/users/${userId}/reset-password`, {
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
  });

  try {
    await passwordGrant(email, password);
    console.log("grant succeeded without lastName");
  } catch (error) {
    console.log("grant failed without lastName:", String(error));
  }

  const getRes = await fetch(`${baseUrl}/admin/realms/${realm}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const user = await getRes.json();
  await fetch(`${baseUrl}/admin/realms/${realm}/users/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...user,
      lastName: "-",
      requiredActions: [],
      emailVerified: true,
      enabled: true,
    }),
  });

  const tokens = await passwordGrant(email, password);
  console.log("grant succeeded after lastName set", Boolean(tokens.access_token));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
