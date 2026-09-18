import { getEnv } from "@/lib/env";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
};

type KeycloakUser = {
  id: string;
  username?: string;
  email?: string;
};

/**
 * Exchanges client credentials for a service-account access token.
 */
export const getServiceAccountToken = async (): Promise<string> => {
  const env = getEnv();
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.KEYCLOAK_CLIENT_ID,
    client_secret: env.KEYCLOAK_CLIENT_SECRET,
  });

  const response = await fetch(
    `${env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Keycloak service account token failed: ${text}`);
  }

  const json = (await response.json()) as TokenResponse;
  return json.access_token;
};

/**
 * Signs in a user with the resource-owner password grant.
 */
export const passwordGrant = async (
  username: string,
  password: string,
): Promise<TokenResponse> => {
  const env = getEnv();
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: env.KEYCLOAK_CLIENT_ID,
    client_secret: env.KEYCLOAK_CLIENT_SECRET,
    username,
    password,
    scope: "openid profile email",
  });

  const response = await fetch(
    `${env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Keycloak password grant failed: ${text}`);
  }

  return (await response.json()) as TokenResponse;
};

/**
 * Resolves Keycloak admin base URL and realm name from the issuer.
 */
const getKeycloakAdminContext = () => {
  const env = getEnv();
  const realm = env.KEYCLOAK_ISSUER.split("/realms/")[1];
  if (!realm) {
    throw new Error("KEYCLOAK_ISSUER must include /realms/{realm}");
  }
  const baseUrl = env.KEYCLOAK_ISSUER.replace(`/realms/${realm}`, "");
  return { env, realm, baseUrl };
};

/**
 * Sets a non-temporary password so the password grant can sign the user in.
 */
const setUserPassword = async (
  userId: string,
  password: string,
  adminToken: string,
) => {
  const { realm, baseUrl } = getKeycloakAdminContext();

  const passwordResponse = await fetch(
    `${baseUrl}/admin/realms/${realm}/users/${userId}/reset-password`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
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
    const text = await passwordResponse.text();
    throw new Error(`Keycloak set password failed: ${text}`);
  }
};

type KeycloakUserRepresentation = {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  requiredActions?: string[];
  attributes?: Record<string, string[]>;
};

/**
 * Clears required actions so Keycloak password grant does not return
 * "Account is not fully set up".
 */
const finalizeUserForLogin = async (
  userId: string,
  adminToken: string,
  input: { email: string; name?: string },
) => {
  const { realm, baseUrl } = getKeycloakAdminContext();

  const getResponse = await fetch(
    `${baseUrl}/admin/realms/${realm}/users/${userId}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  if (!getResponse.ok) {
    const text = await getResponse.text();
    throw new Error(`Keycloak get user failed: ${text}`);
  }

  const user = (await getResponse.json()) as KeycloakUserRepresentation;
  const firstName =
    input.name?.split(" ")[0] || user.firstName || input.email.split("@")[0];
  const lastName =
    input.name?.split(" ").slice(1).join(" ") || user.lastName || "-";

  const updateResponse = await fetch(
    `${baseUrl}/admin/realms/${realm}/users/${userId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...user,
        enabled: true,
        emailVerified: true,
        requiredActions: [],
        firstName,
        lastName,
      }),
    },
  );

  if (!updateResponse.ok) {
    const text = await updateResponse.text();
    throw new Error(`Keycloak finalize user failed: ${text}`);
  }
};

/**
 * Creates a Keycloak user via the Admin API.
 */
export const createKeycloakUser = async (input: {
  email: string;
  password: string;
  name?: string;
}): Promise<string> => {
  const { realm, baseUrl } = getKeycloakAdminContext();
  const token = await getServiceAccountToken();
  const firstName = input.name?.split(" ")[0] || input.email.split("@")[0];
  const lastName = input.name?.split(" ").slice(1).join(" ") || "-";
  const payload = {
    username: input.email.toLowerCase(),
    email: input.email.toLowerCase(),
    enabled: true,
    emailVerified: true,
    requiredActions: [] as string[],
    firstName,
    lastName,
  };

  const response = await fetch(`${baseUrl}/admin/realms/${realm}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 409) {
    throw new Error("USER_EXISTS");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Keycloak create user failed: ${text}`);
  }

  let userId = response.headers.get("Location")?.split("/").pop();
  if (!userId) {
    const usersResponse = await fetch(
      `${baseUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(input.email.toLowerCase())}&exact=true`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!usersResponse.ok) {
      throw new Error("Keycloak user created but id lookup failed");
    }
    const users = (await usersResponse.json()) as KeycloakUser[];
    userId = users[0]?.id;
  }

  if (!userId) {
    throw new Error("Keycloak user created but id missing");
  }

  await setUserPassword(userId, input.password, token);
  await finalizeUserForLogin(userId, token, input);
  return userId;
};

/**
 * Updates a Keycloak user's display name (first/last name fields).
 */
export const updateKeycloakDisplayName = async (
  userId: string,
  name: string,
): Promise<void> => {
  const { realm, baseUrl } = getKeycloakAdminContext();
  const adminToken = await getServiceAccountToken();

  const getResponse = await fetch(
    `${baseUrl}/admin/realms/${realm}/users/${userId}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  if (!getResponse.ok) {
    const text = await getResponse.text();
    throw new Error(`Keycloak get user failed: ${text}`);
  }

  const user = (await getResponse.json()) as KeycloakUserRepresentation;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? name.trim();
  const lastName = parts.slice(1).join(" ") || "-";

  const updateResponse = await fetch(
    `${baseUrl}/admin/realms/${realm}/users/${userId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...user,
        firstName,
        lastName,
      }),
    },
  );

  if (!updateResponse.ok) {
    const text = await updateResponse.text();
    throw new Error(`Keycloak update display name failed: ${text}`);
  }
};

/**
 * Decodes the JWT payload without verifying (tokens come from Keycloak TLS).
 */
export const decodeJwtPayload = <T extends Record<string, unknown>>(
  token: string,
): T => {
  const [, payload] = token.split(".");
  if (!payload) {
    throw new Error("Invalid JWT");
  }
  const json = Buffer.from(payload, "base64url").toString("utf8");
  return JSON.parse(json) as T;
};
