import { Lock, Mail } from "lucide-react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { AuthShell } from "../components/auth/authShell";
import { BrandMark } from "../components/brandMark";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
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
      onSuccess: () => {
        toast.success("Welcome back");
        navigate("/projects");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto grid w-full max-w-sm gap-4 py-24">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <AuthShell>
      <Card className="grid gap-6 p-7 shadow-lg">
        <div className="grid gap-3">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back to deployClone.</p>
          </div>
        </div>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Label className="grid gap-2">
            <span>
              Email <span className="text-block">*</span>
            </span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                {...form.register("email")}
                type="email"
                placeholder="you@example.com"
                className="pl-10"
              />
            </div>
            {form.formState.errors.email ? (
              <span className="text-xs text-block">{form.formState.errors.email.message}</span>
            ) : null}
          </Label>
          <Label className="grid gap-2">
            <span>
              Password <span className="text-block">*</span>
            </span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                {...form.register("password")}
                type="password"
                placeholder="••••••••"
                className="pl-10"
              />
            </div>
            {form.formState.errors.password ? (
              <span className="text-xs text-block">{form.formState.errors.password.message}</span>
            ) : null}
          </Label>
          <Button type="submit" disabled={loginMutation.isPending} className="mt-1 h-11">
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Don&rsquo;t have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
