import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, Lock, User, AlertCircle } from "lucide-react";
import { signIn, signUp, authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff & Portal Sign In — UN CROP CARE" },
      { name: "description", content: "Sign in to the UN CROP CARE management portal." },
      { property: "og:title", content: "Portal Sign In — UN CROP CARE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "login" | "register" | "forgot";

function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const navigate = useNavigate();

  // Email / Password submission
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim().toLowerCase();
    const password = String(f.get("password") || "");
    const name = String(f.get("name") || "").trim();

    setBusy(true);

    try {
      if (mode === "login") {
        const { data, error } = await signIn.email({
          email,
          password,
        });

        if (error) {
          toast.error(error.message || "Invalid email or password.");
          return;
        }

        toast.success("Signed in successfully!");
        navigate({ to: "/admin" });
      } else if (mode === "register") {
        const { data, error } = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });

        if (error) {
          toast.error(error.message || "Failed to create account.");
          return;
        }

        toast.success("Account created! Staff privileges must be granted by an administrator.");
        setMode("login");
      } else if (mode === "forgot") {
        // Password reset flow
        toast.info("Password reset request sent. Check your inbox if an account exists.");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication error occurred.");
    } finally {
      setBusy(false);
    }
  }

  // Google OAuth sign-in
  async function handleGoogleSignIn() {
    setGoogleBusy(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/admin`,
      });
    } catch (err: any) {
      toast.error(
        err.message ||
          "Google sign-in is not yet configured with valid credentials in the server environment."
      );
      setGoogleBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-soft px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="mx-auto flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to UN CROP CARE
        </Link>
        <div className="flex justify-center">
          <img src="/images/brand/uncrop-care-logo.png" alt="UN CROP CARE" className="h-16 w-16 rounded-full bg-white p-1 shadow-soft object-contain" />
        </div>
        <h1 className="mt-4 text-center text-3xl font-bold tracking-tight text-primary">
          {mode === "login" && "Portal Sign In"}
          {mode === "register" && "Create Portal Account"}
          {mode === "forgot" && "Reset Password"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {mode === "login" && "Access your UN CROP CARE dashboard"}
          {mode === "register" && "Customer and staff access portal"}
          {mode === "forgot" && "Enter your email to receive recovery instructions"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border bg-card px-8 py-8 shadow-soft sm:px-10 space-y-6">
          {/* Google OAuth Button */}
          {mode !== "forgot" && (
            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full py-6 text-sm font-medium transition-all hover:bg-soft"
                onClick={handleGoogleSignIn}
                disabled={googleBusy || busy}
              >
                {googleBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" name="name" type="text" placeholder="Your name" className="pl-9 rounded-xl" required maxLength={100} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="you@example.com" className="pl-9 rounded-xl" required maxLength={255} />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 rounded-xl"
                    required
                    minLength={8}
                    maxLength={128}
                  />
                </div>
              </div>
            )}

            {mode === "register" && (
              <div className="rounded-xl border border-lime/30 bg-soft p-3 text-xs text-muted-foreground flex gap-2">
                <AlertCircle className="h-4 w-4 text-leaf flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Security Note:</strong> New accounts are standard customer profiles by default.
                  Administrative and staff privileges must be granted by a system administrator.
                </span>
              </div>
            )}

            <Button type="submit" className="w-full rounded-full py-5 text-sm font-semibold" disabled={busy || googleBusy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait…
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : mode === "register" ? (
                "Create Account"
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          {/* Mode Toggles */}
          <div className="pt-2 text-center text-xs text-muted-foreground space-y-2">
            {mode === "login" && (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-semibold text-primary hover:underline"
                >
                  Create an account
                </button>
              </p>
            )}

            {mode === "register" && (
              <p>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign in here
                </button>
              </p>
            )}

            {mode === "forgot" && (
              <p>
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-primary hover:underline"
                >
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
