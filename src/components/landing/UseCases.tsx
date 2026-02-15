import { AnimatedSection, AnimatedElement } from "./AnimatedSection";
import {
  Rocket, Code, PenTool, BookOpen, ClipboardList,
  Briefcase, FileText, BarChart3, GraduationCap,
} from "lucide-react";

const useCases = [
  {
    icon: Rocket,
    title: "For Founders",
    description: "Track product decisions and strategic thinking across weeks. Never re-explain your vision.",
  },
  {
    icon: Code,
    title: "For Developers",
    description: "Compare solutions across models. Keep your entire codebase context in one workspace.",
  },
  {
    icon: PenTool,
    title: "For Content Creators",
    description: "Research, outline, write — all in one board where your creative process compounds.",
  },
  {
    icon: BookOpen,
    title: "For Researchers",
    description: "Build knowledge bases that persist. Reference past findings without starting over.",
  },
  {
    icon: ClipboardList,
    title: "For Product Managers",
    description: "Document requirements, user insights, and decisions in persistent project boards.",
  },
  {
    icon: Briefcase,
    title: "For Consultants",
    description: "Organize client work with separate boards. Keep context for each engagement.",
  },
  {
    icon: FileText,
    title: "For Writers",
    description: "Draft, revise, and refine with AI across multiple sessions. Your drafts persist.",
  },
  {
    icon: BarChart3,
    title: "For Marketers",
    description: "Plan campaigns, generate copy variations, and analyze trends in organized boards.",
  },
  {
    icon: GraduationCap,
    title: "For Educators",
    description: "Create lesson plans and course materials with AI that remembers your teaching context.",
  },
];

const UseCases = () => {
  return (
    <section className="relative dot-grid-bg py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection delay={0} className="text-center mb-8 sm:mb-12 md:mb-16">
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Use Cases
          </span>
          <h2 className="font-display italic font-bold text-foreground mt-4 text-wrap-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
            Built For Serious AI Work
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {useCases.map((useCase, index) => (
            <AnimatedElement key={useCase.title} delay={index * 80}>
              <div className="glass-card-hover group p-5 sm:p-6 h-full flex flex-col">
                <div className="glass-icon-box w-10 h-10 mb-4">
                  <useCase.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm sm:text-base mb-2">
                  {useCase.title}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed flex-1">
                  {useCase.description}
                </p>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
