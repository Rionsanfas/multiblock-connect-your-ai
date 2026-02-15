import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LifetimeDealBar } from "@/components/layout/LifetimeDealBar";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import Comparison from "@/components/landing/Comparison";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Show nothing while checking auth to avoid flash
  if (isLoading) {
    return null;
  }

  return (
    <div className="liquid-bg noise-overlay min-h-screen dot-grid-bg">
      <LifetimeDealBar />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Comparison />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
