import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { AuthShell } from "../components/auth/authShell";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLoginMutation } from "../hooks/queries/useAuth";
import { useAuth } from "../lib/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLoginMutation();

  const onSubmit: SubmitHandler<LoginValues> = (values) => {
    loginMutation.mutate(values, {
      onSuccess: () => navigate("/projects"),
    });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <AuthShell>
      <Card className="grid gap-6 p-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back to deployClone.</p>
        </div>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Label className="grid gap-2">
            Email
            <Input {...form.register("email")} type="email" placeholder="you@example.com" />
            {form.formState.errors.email ? (
              <span className="text-xs text-block">{form.formState.errors.email.message}</span>
            ) : null}
          </Label>
          <Label className="grid gap-2">
            Password
            <Input {...form.register("password")} type="password" placeholder="••••••••" />
            {form.formState.errors.password ? (
              <span className="text-xs text-block">{form.formState.errors.password.message}</span>
            ) : null}
          </Label>
          <Button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Don&rsquo;t have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
