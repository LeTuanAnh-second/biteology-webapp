
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import PrivateRoute from "@/components/auth/PrivateRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import HealthTracking from "./pages/HealthTracking";
import NutritionAdvice from "./pages/NutritionAdvice";
import KnowledgeBase from "./pages/KnowledgeBase";
import Profile from "./pages/Profile";
import Premium from "./pages/Premium";
import PaymentResult from "./pages/PaymentResult";
import About from "./pages/About";
import ExpertConsultation from "./pages/ExpertConsultation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/premium"
              element={
                <PrivateRoute>
                  <Premium />
                </PrivateRoute>
              }
            />
            <Route
              path="/payment-result"
              element={
                <PrivateRoute>
                  <PaymentResult />
                </PrivateRoute>
              }
            />
            <Route
              path="/health-tracking"
              element={
                <PrivateRoute requirePremium={true}>
                  <HealthTracking />
                </PrivateRoute>
              }
            />
            <Route
              path="/nutrition-advice"
              element={
                <PrivateRoute requirePremium={true}>
                  <NutritionAdvice />
                </PrivateRoute>
              }
            />
            <Route
              path="/knowledge-base"
              element={
                <PrivateRoute requirePremium={true}>
                  <KnowledgeBase />
                </PrivateRoute>
              }
            />
            <Route
              path="/expert-consultation"
              element={
                <PrivateRoute requirePremium={true}>
                  <ExpertConsultation />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
