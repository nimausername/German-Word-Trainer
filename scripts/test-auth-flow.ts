import "dotenv/config";
import { createKeycloakUser, passwordGrant } from "../src/lib/keycloak";

const email = `ready-${Date.now()}@example.com`;
const password = "TestPass123!";

const main = async () => {
  const id = await createKeycloakUser({
    email,
    password,
    name: "Mina",
  });
  console.log("created", id);
  const tokens = await passwordGrant(email, password);
  console.log("password grant OK", Boolean(tokens.access_token));
};

main().catch((error) => {
  console.error("FAIL", error);
  process.exit(1);
});
