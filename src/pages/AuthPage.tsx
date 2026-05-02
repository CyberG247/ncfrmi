import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/site/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logo from "@/assets/ncfrmi-logo.png";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "");
    const password = String(f.get("password") || "");
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate("/dashboard");
      } else {
        const full_name = String(f.get("full_name") || "");
        const phone = String(f.get("phone") || "");
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name, phone } },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err?.message || "Authentication failed");
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <section className="container-page grid min-h-[70vh] items-center py-12">
        <Card className="mx-auto w-full max-w-md shadow-elegant">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <img src={logo} alt="NCFRMI" className="h-16 w-16" width={64} height={64} />
              <h1 className="mt-4 font-display text-2xl font-bold">{isLogin ? "Welcome back" : "Create your account"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLogin ? "Sign in to continue your application." : "Get started with a secure NCFRMI account."}
              </p>
            </div>
            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              {!isLogin && (
                <>
                  <div><label className="text-sm font-medium">Full name</label><Input name="full_name" required className="mt-1.5" /></div>
                  <div><label className="text-sm font-medium">Phone</label><Input name="phone" required type="tel" className="mt-1.5" placeholder="+234…" /></div>
                </>
              )}
              <div><label className="text-sm font-medium">Email</label><Input name="email" required type="email" className="mt-1.5" /></div>
              <div><label className="text-sm font-medium">Password</label><Input name="password" required type="password" minLength={8} className="mt-1.5" /></div>
              <Button type="submit" size="lg" className="mt-2" disabled={loading}>
                {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
              </Button>
            </form>
            <div className="mt-5 text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>New to NCFRMI? <Link to="/register" className="font-semibold text-primary hover:underline">Create account</Link></>
              ) : (
                <>Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link></>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
