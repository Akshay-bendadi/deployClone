import { Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { useAuth } from "../lib/auth";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Compass className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          There&rsquo;s nothing at this address. It may have moved, or the link was typed wrong.
        </p>
      </div>
      <Button onClick={() => navigate(isAuthenticated ? "/projects" : "/")}>
        {isAuthenticated ? "Back to projects" : "Back home"}
      </Button>
    </div>
  );
}
