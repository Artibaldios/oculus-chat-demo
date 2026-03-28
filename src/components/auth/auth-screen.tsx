"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, register } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const authFormSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type AuthFormValues = z.infer<typeof authFormSchema>;

function AuthForm({
  submitLabel,
  onSubmit,
  isPending = false,
}: {
  submitLabel: string;
  onSubmit: (values: AuthFormValues) => Promise<void>;
  isPending?: boolean;
}) {
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const emailField = form.register("email");
  const passwordField = form.register("password");

  async function handleSubmit(values: AuthFormValues) {
    form.clearErrors("root");

    try {
      await onSubmit(values);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed";

      form.setError("root", {
        type: "server",
        message,
      });
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-2">
        <Label htmlFor={`${submitLabel}-email`}>Email</Label>
        <Input
          id={`${submitLabel}-email`}
          {...emailField}
          onChange={(event) => {
            form.clearErrors("root");
            void emailField.onChange(event);
          }}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${submitLabel}-password`}>Password</Label>
        <Input
          id={`${submitLabel}-password`}
          type="password"
          {...passwordField}
          onChange={(event) => {
            form.clearErrors("root");
            void passwordField.onChange(event);
          }}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>
      {form.formState.errors.root?.message && (
        <p className="text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isPending || form.formState.isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}

export function AuthScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      setNotice(null);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.push("/");
      router.refresh();
    },
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });

      if (result.needsEmailConfirmation) {
        setNotice(
          "Registration succeeded. Check your email to confirm the account, then sign in.",
        );
        return;
      }

      setNotice(null);
      router.push("/");
      router.refresh();
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fff7ed_0%,_#fff_50%,_#f8fafc_100%)] px-4 py-10">
      <Card className="w-full max-w-md rounded-[2rem] border-border/70 bg-white/85 p-6 shadow-xl shadow-orange-100">
        <div className="mb-6 space-y-2 text-center">
          <p className="font-heading text-3xl font-semibold tracking-tight">
            Welcome back
          </p>
          <p className="text-sm text-muted-foreground">
            Sign in to save chats, sync across tabs, and upload files.
          </p>
          {notice && <p className="text-sm text-primary">{notice}</p>}
        </div>
        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-6">
            <AuthForm
              submitLabel="Login"
              isPending={loginMutation.isPending}
              onSubmit={async (values) => {
                await loginMutation.mutateAsync(values);
              }}
            />
          </TabsContent>
          <TabsContent value="register" className="pt-6">
            <AuthForm
              submitLabel="Register"
              isPending={registerMutation.isPending}
              onSubmit={async (values) => {
                await registerMutation.mutateAsync(values);
              }}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
