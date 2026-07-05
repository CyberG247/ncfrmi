import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/site/ProtectedRoute";
import SplashScreen from "@/components/site/SplashScreen";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import About from "./pages/About.tsx";
import Services from "./pages/Services.tsx";
import Apply from "./pages/Apply.tsx";
import FieldCapture from "./pages/FieldCapture.tsx";
import RegistrantsList from "./pages/RegistrantsList.tsx";
import RegistrantDetail from "./pages/RegistrantDetail.tsx";
import Offices from "./pages/Offices.tsx";
import News from "./pages/News.tsx";
import Report from "./pages/Report.tsx";
import Contact from "./pages/Contact.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NewApplication from "./pages/NewApplication.tsx";
import ApplicationDetail from "./pages/ApplicationDetail.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Preload critical data (auth session) before hiding splash.
    const start = Date.now();
    supabase.auth.getSession().finally(() => {
      // Ensure at least a brief moment so the splash doesn't flash off instantly on fast networks.
      const elapsed = Date.now() - start;
      const wait = Math.max(0, 200 - elapsed);
      setTimeout(() => { if (!cancelled) setReady(true); }, wait);
    });
    return () => { cancelled = true; };
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SplashScreen minDuration={3000} ready={ready} />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/field-capture" element={<FieldCapture />} />
            <Route path="/registrants" element={<ProtectedRoute allowedRoles={["officer", "commissioner"]}><RegistrantsList /></ProtectedRoute>} />
            <Route path="/registrants/:id" element={<ProtectedRoute allowedRoles={["officer", "commissioner"]}><RegistrantDetail /></ProtectedRoute>} />
            <Route path="/offices" element={<Offices />} />
            <Route path="/news" element={<News />} />
            <Route path="/report" element={<Report />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/new" element={<ProtectedRoute><NewApplication /></ProtectedRoute>} />
            <Route path="/dashboard/applications/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
