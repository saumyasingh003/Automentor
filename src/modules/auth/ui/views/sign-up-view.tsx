"use client";

import { z } from "zod";
import { OctagonAlert } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaGithub, FaGoogle } from "react-icons/fa";

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const SignUpView = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);

    authClient.signUp.email(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
          router.push("/");
        },
        onError: ({ error }) => {
          setError(error.message);
        },
      }
    );
  };

  const onSocial = (provider: "github" | "google") => {
    setError(null);
    setPending(true);

    authClient.signIn.social(
      {
        provider,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
        },
        onError: ({ error }) => {
          setError(error.message);
        },
      }
    );
  };

  return (
    <div className="flex h-screen">
      {/* Left Form Section */}
      <div className="w-1/2 h-full bg-white flex items-center justify-center ">
        <div className="w-full max-w-md p-8  ">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col items-center text-center">
                <h1 className="text-3xl font-bold">Let&apos;s Get Started!</h1>
                <p className="text-muted-foreground text-balance">
                  Create your account
                </p>
              </div>

              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@example.com"
                          {...field}
                        />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!!error && (
                <Alert className="bg-destructive/30 border-none">
                  <OctagonAlert className="h-4 w-4 !text-destructive" />
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}

              <Button disabled={pending} type="submit" className="w-full">
                Sign Up
              </Button>

              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <div className="flex-1 border-t border-border"></div>
                <span className="px-2 bg-white">Or Continue with</span>
                <div className="flex-1 border-t border-border"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  disabled={pending}
                  onClick={() => onSocial("google")}
                >
                  <FaGoogle size={40} color="black" />
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={pending}
                  onClick={() => onSocial("github")}
                >
                  <FaGithub size={40} color="black" />
                </Button>
              </div>

              <div className="text-sm text-center">
                Already have an account?{" "}
                <a href="/sign-in" className="hover:underline">
                  Sign In
                </a>
              </div>
            </form>
          </Form>

          <div className="text-muted-foreground mt-4 text-center text-xs">
            By clicking continue, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-4">
              Terms of Services
            </a>
          </div>
        </div>
      </div>

      {/* Right Image */}
      <div className="w-1/2 h-full">
        <img
          src="/pic.png"
          alt="Side Image"
          className="relative top-50  left-10 object-cover"
        />
      </div>
    </div>
  );
};
