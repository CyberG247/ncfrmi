import { Link } from "react-router-dom";
import Layout from "@/components/site/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logo from "@/assets/ncfrmi-logo.png";
import { toast } from "@/hooks/use-toast";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: isLogin ? "Sign-in coming soon" : "Account creation coming soon", description: "Connect Lovable Cloud to enable secure authentication." });
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
                <div><label className="text-sm font-medium">Full name</label><Input required className="mt-1.5" /></div>
              )}
              <div><label className="text-sm font-medium">Email</label><Input required type="email" className="mt-1.5" /></div>
              <div><label className="text-sm font-medium">Phone</label><Input required type="tel" className="mt-1.5" placeholder="+234…" /></div>
              <div><label className="text-sm font-medium">Password</label><Input required type="password" className="mt-1.5" /></div>
              <Button type="submit" size="lg" className="mt-2">{isLogin ? "Sign in" : "Create account"}</Button>
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
