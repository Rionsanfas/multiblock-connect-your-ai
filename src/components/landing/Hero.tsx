import { ArrowRight, Play } from "lucide-react";
import MockUI from "./MockUI";

const Hero = () => {
  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      {/* Background Gradients */}
      <div className="gradient-blur w-[600px] h-[600px] bg-accent/20 -top-40 -right-40 absolute" />
      <div className="gradient-blur w-[400px] h-[400px] bg-muted-foreground/10 bottom-20 -left-20 absolute" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-muted-foreground">Now in Early Access</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6 animate-fade-up delay-100">
            One Workspace.
            <br />
            <span className="glow-text">Every AI Model.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
            Create blocks for different AI models, chat with them, and connect outputs 
            to automate your workflows. Your keys, your control.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up delay-300">
            <a href="#pricing" className="btn-primary flex items-center gap-2">
              Get Early Access
              <ArrowRight size={18} />
            </a>
            <a href="#how-it-works" className="btn-outline flex items-center gap-2">
              <Play size={18} />
              View Demo
            </a>
          </div>

          {/* Mock UI */}
          <div className="animate-fade-up delay-400">
            <MockUI />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
