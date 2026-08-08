"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { useAuth } from "../lib/auth";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function AuthPanel() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [name, setName] = useState("Avery");
  const [email, setEmail] = useState("avery@example.com");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login({ name, email });
  }

  return (
    <Card className="grid gap-4 border-border/80 bg-background/80 shadow-xl">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Auth scaffold
        </p>
        <h2 className="text-2xl font-semibold">
          {isAuthenticated && user ? "Welcome back, " + user.name : "Ready for sign in"}
        </h2>
      </div>

      {isAuthenticated && user ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <Button type="button" onClick={logout}>
            Sign out
          </Button>
        </div>
      ) : (
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <Label className="grid gap-2">
            Name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Avery"
            />
          </Label>
          <Label className="grid gap-2">
            Email
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="avery@example.com"
              type="email"
            />
          </Label>
          <Button type="submit">Sign in</Button>
        </form>
      )}
    </Card>
  );
}
