import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnimatedSection, AnimatedElement } from "./AnimatedSection";

const faqs = [
  {
    question: "Do I need to provide my own API keys?",
    answer:
      "Yes, Multiblock uses your own API keys for each AI provider. This means you have full control over your usage and costs, and we never store or see your conversations.",
  },
  {
    question: "Which AI models are supported?",
    answer:
      "We support all major providers including OpenAI (GPT-5), Anthropic (Claude 4), Google (Gemini), xAI, and more. We're constantly adding new models as they become available.",
  },
  {
    question: "What's the difference between blocks and boards?",
    answer:
      "A block is an individual AI model chat instance. A board is a workspace where you arrange multiple blocks. Think of blocks as chat windows and boards as your desk where you organize them.",
  },
  {
    question: "Can I connect blocks to create automated workflows?",
    answer:
      "Absolutely! That's one of our core features. You can connect the output of one block to the input of another, creating chains of AI processing. For example, have GPT-5 summarize text, then feed it to Claude for analysis.",
  },
  {
    question: "How does pricing work for AI usage?",
    answer:
      "Multiblock itself has a subscription for features and workspace limits. The AI usage costs are separate and billed directly by each provider based on your API keys. You pay them directly.",
  },
  {
    question: "Can I share workspaces with my team?",
    answer:
      "Yes, on the Teams plan you can invite collaborators to shared workspaces. Everyone can add blocks, connect workflows, and work together in real-time.",
  },
  {
    question: "Is there a limit to how many blocks I can create?",
    answer:
      "Free users can create up to 3 blocks. Pro and Teams plans have unlimited blocks. There's no limit to how many connections you can make between them.",
  },
];

const FAQ = () => {
  return (
    <section
      id="faq"
      className="relative dot-grid-bg py-12 sm:py-16 md:py-20 lg:py-24"
    >
      {/* Container */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection delay={0} className="text-center mb-8 sm:mb-12 md:mb-16">
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            FAQ
          </span>
          <h2 className="font-bold text-foreground mt-4 text-wrap-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
            Got Questions?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-break text-sm sm:text-base">
            Get answers before you start building connected AI workflows.
          </p>
        </AnimatedSection>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-2 sm:space-y-3">
            {faqs.map((faq, index) => (
              <AnimatedElement key={index} delay={index * 80}>
                <AccordionItem
                  value={`item-${index}`}
                  className="glass-card border-border rounded-xl overflow-hidden px-4 sm:px-6"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline text-break text-sm sm:text-base py-4 sm:py-5 min-h-[48px]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-break text-sm sm:text-base pb-4 sm:pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </AnimatedElement>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
