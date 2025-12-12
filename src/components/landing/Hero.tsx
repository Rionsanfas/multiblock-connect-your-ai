import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroBlocks } from "./HeroBlocks";

const Hero = () => {
  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      {/* Soft Warm Noisy Background */}
      <div className="absolute inset-0 hero-glow-bg" />
      <div className="absolute inset-0 hero-noise" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[70vh]">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse motion-reduce:animate-none" />
              <span className="text-sm text-muted-foreground">Now in Early Access</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight mb-6 animate-fade-up delay-100">
              One Workspace.
              <br />
              <span className="glow-text">Every AI Model.</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 animate-fade-up delay-200">
              Create blocks for different AI models, chat with them, and connect outputs 
              to automate your workflows. Your keys, your control.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-up delay-300">
              <Link to="/auth" className="btn-primary flex items-center gap-2">
                Get Early Access
                <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="btn-outline flex items-center gap-2">
                <Play size={18} />
                View Demo
              </a>
            </div>
          </div>

          {/* Right: Connected Blocks Visual */}
          <div className="order-1 lg:order-2 h-[400px] md:h-[500px] lg:h-[600px] animate-fade-up delay-200">
            <HeroBlocks />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;