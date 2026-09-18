"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

/**
 * Shared English auth form for sign-in and sign-up.
 * Uses ReUI Field + InputGroup icon addons (c-card-12 / c-input-group-4).
 */
export const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      if (mode === "sign-up") {
        const response = await fetch("/api/v1/auth/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            name: name || undefined,
          }),
        });
        const body = await response.json();
        if (!response.ok) {
          setError(body?.error?.message ?? "Sign up failed");
          return;
        }
      }

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setError(
          mode === "sign-up"
            ? "Account created, but sign-in failed. Try Sign in, or reset the password in Keycloak."
            : "Invalid email or password",
        );
        return;
      }

      router.push("/home");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  };

  const handleTogglePassword = () => {
    setPasswordVisible((current) => !current);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </CardTitle>
        <CardDescription className="text-pretty">
          {mode === "sign-in"
            ? "Continue learning German vocabulary."
            : "Start your path to 4000 German words."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <FieldGroup>
            {mode === "sign-up" ? (
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <InputGroup className="h-11 min-h-11">
                  <InputGroupAddon align="inline-start">
                    <UserIcon aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder="Your name"
                    className="text-base md:text-sm"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </InputGroup>
              </Field>
            ) : null}

            <Field>
              <FieldLabel htmlFor="email">
                {mode === "sign-in" ? "Username / email" : "Email"}
              </FieldLabel>
              <InputGroup className="h-11 min-h-11">
                <InputGroupAddon align="inline-start">
                  <MailIcon aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="name@example.com"
                  className="text-base md:text-sm"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <InputGroup className="h-11 min-h-11">
                <InputGroupAddon align="inline-start">
                  <LockIcon aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  id="password"
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete={
                    mode === "sign-in" ? "current-password" : "new-password"
                  }
                  required
                  minLength={8}
                  placeholder="Password"
                  className="text-base md:text-sm"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-sm"
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                    aria-pressed={passwordVisible}
                    onClick={handleTogglePassword}
                  >
                    {passwordVisible ? (
                      <EyeOffIcon aria-hidden="true" />
                    ) : (
                      <EyeIcon aria-hidden="true" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            {error ? <FieldError>{error}</FieldError> : null}
          </FieldGroup>

          <Button
            type="submit"
            size="lg"
            className="min-h-11 w-full"
            disabled={pending}
          >
            {pending
              ? "Please wait…"
              : mode === "sign-in"
                ? "Sign in"
                : "Sign up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
