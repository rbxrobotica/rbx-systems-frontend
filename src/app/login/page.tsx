// src/app/login/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import config from "@/config/config";

const urlBackend = config.urlBackend;

// Esquema de validação do formulário
const FormSchema = z.object({
  username: z.string().min(4, {
    message: "O usuário precisa ter pelo menos 4 caracteres",
  }),
  password: z.string().min(1, {
    message: "Necessário uma senha",
  }),
});

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${urlBackend}/api/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Login falhou. Verifique suas credenciais.");
      }

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem("accessToken", result.access);
        router.push("/dashboard")
      } else {
        console.log("Login falhou");
      }

    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-screen flex items-center justify-center">
      <Form {...form}>
        <form
          method="POST"
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-md space-y-6 border border-foreground rounded-lg p-8"
        >
          <p className="text-center font-bold text-lg sm:text-xl">Entrar na conta</p>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuário</FormLabel>
                <FormControl>
                  <Input placeholder="shadcn" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            <span className="font-bold">{loading ? "Carregando..." : "Acessar"}</span>
          </Button>
        </form>
      </Form>
    </main>
  );
}
