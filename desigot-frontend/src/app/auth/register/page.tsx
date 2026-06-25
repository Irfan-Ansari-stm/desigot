"use client";
import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserPlus, ShoppingBag, Brush } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Min 8 characters").regex(/[A-Z]/, "Need uppercase").regex(/[0-9]/, "Need number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type FormData = z.infer<typeof schema>;

function RegisterPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<"buyer" | "seller">(
    params.get("role") === "seller" ? "seller" : "buyer"
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.email, data.password, data.display_name, role);
      toast.success("Account created! Welcome to Desigot 🎉");
      router.push(role === "seller" ? "/seller-dashboard" : "/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center">
              <span className="text-white font-black">D</span>
            </div>
            <span className="font-black text-xl text-brand">Desigot</span>
          </Link>
          <h1 className="text-2xl font-bold text-ink-primary">Create your account</h1>
          <p className="text-ink-secondary text-sm mt-1">Join 200K+ designers & buyers</p>
        </div>

        {/* Role toggle */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {[
            { value: "buyer", label: "I want to buy", icon: <ShoppingBag className="h-4 w-4" /> },
            { value: "seller", label: "I want to sell", icon: <Brush className="h-4 w-4" /> },
          ].map((r) => (
            <button key={r.value} onClick={() => setRole(r.value as "buyer" | "seller")}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all",
                role === r.value ? "bg-brand text-white border-brand" : "bg-white border-border text-ink-60 hover:bg-surface-50"
              )}>
              {r.icon} {r.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" placeholder="Jane Smith" errorMessage={errors.display_name?.message} {...register("display_name")} />
            <Input label="Email" type="email" placeholder="you@example.com" errorMessage={errors.email?.message} {...register("email")} />
            <Input label="Password" type={showPw ? "text" : "password"} placeholder="Min 8 chars, 1 uppercase, 1 number"
              errorMessage={errors.password?.message}
              suffix={<button type="button" onClick={() => setShowPw(!showPw)} className="text-ink-secondary hover:text-ink-primary">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
              {...register("password")} />
            <Input label="Confirm Password" type={showPw ? "text" : "password"} placeholder="Repeat password"
              errorMessage={errors.confirmPassword?.message} {...register("confirmPassword")} />

            <p className="text-xs text-ink-secondary">
              By signing up, you agree to our{" "}
              <Link href="#" className="text-accent hover:underline">Terms of Service</Link> and{" "}
              <Link href="#" className="text-accent hover:underline">Privacy Policy</Link>.
            </p>

            <Button type="submit" fullWidth loading={isLoading} leftIcon={<UserPlus className="h-4 w-4" />}>
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-secondary mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-accent font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-50 flex items-center justify-center"><div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterPageInner />
    </Suspense>
  );
}
