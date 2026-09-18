import "dotenv/config";
import { getServiceAccountToken } from "../src/lib/keycloak";

const main = async () => {
  const token = await getServiceAccountToken();
  console.log(`Service account token OK (length=${token.length})`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
