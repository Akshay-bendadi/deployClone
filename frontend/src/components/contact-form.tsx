"use client";

import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export function ContactForm() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit: SubmitHandler<ContactFormValues> = (values) => {
    toast.success(`Thanks ${values.name}, your message is ready for production flow.`);
    form.reset();
  };

  return (
    <Card className="grid gap-4 border-border/80 bg-background/80 shadow-xl">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Forms stack
        </p>
        <h2 className="text-2xl font-semibold">Zod + React Hook Form</h2>
      </div>

      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Label className="grid gap-2">
          Name
          <Input {...form.register("name")} placeholder="Avery" />
          {form.formState.errors.name ? (
            <span className="text-xs text-red-500">{form.formState.errors.name.message}</span>
          ) : null}
        </Label>

        <Label className="grid gap-2">
          Email
          <Input {...form.register("email")} placeholder="avery@example.com" type="email" />
          {form.formState.errors.email ? (
            <span className="text-xs text-red-500">{form.formState.errors.email.message}</span>
          ) : null}
        </Label>

        <Label className="grid gap-2">
          Message
          <Textarea {...form.register("message")} placeholder="Tell us what you want to build..." />
          {form.formState.errors.message ? (
            <span className="text-xs text-red-500">{form.formState.errors.message.message}</span>
          ) : null}
        </Label>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          Send message
        </Button>
      </form>
    </Card>
  );
}
