import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do I need to provide my own API keys?",
    answer: "Yes, Multiblock uses your own API keys for each AI provider. This means you have full control over your usage and costs, and we never store or see your conversations.",
  },
  {
    question: "Which AI models are supported?",
    answer: "We support all major providers including OpenAI (GPT-4, GPT-4o), Anthropic (Claude 3), Google (Gemini), Mistral, and more. We're constantly adding new models as they become available.",
  },
  {
    question: "What's the difference between blocks and boards?",
    answer: "A block is an individual AI model chat instance. A board is a workspace where you arrange multiple blocks. Think of blocks as chat windows and boards as your desk where you organize them.",
  },
  {
    question: "Is my data stored on your servers?",
    answer: "No. All conversations happen directly between your browser and the AI providers. We only store your workspace layout and block configurations, not the actual chat content.",
  },
  {
    question: "Can I connect blocks to create automated workflows?",
    answer: "Absolutely! That's one of our core features. You can connect the output of one block to the input of another, creating chains of AI processing. For example, have GPT-4 summarize text, then feed it to Claude for analysis.",
  },
  {
    question: "How does pricing work for AI usage?",
    answer: "Multiblock itself has a subscription for features and workspace limits. The AI usage costs are separate and billed directly by each provider based on your API keys. You pay them directly.",
  },
  {
    question: "Can I share workspaces with my team?",
    answer: "Yes, on the Teams plan you can invite collaborators to shared workspaces. Everyone can add blocks, connect workflows, and work together in real-time.",
  },
  {
    question: "Is there a limit to how many blocks I can create?",
    answer: "Free users can create up to 3 blocks. Pro and Teams plans have unlimited blocks. There's no limit to how many connections you can make between them.",
  },
];

const FAQ = () => {
  return (
    <section 
      id="faq" 
      className="relative"
      style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
    >
      {/* Container */}
      <div 
        className="w-full max-w-[1200px] mx-auto"
        style={{ paddingLeft: "clamp(16px, 4vw, 32px)", paddingRight: "clamp(16px, 4vw, 32px)" }}
      >
        {/* Header */}
        <div 
          className="text-center"
          style={{ marginBottom: "clamp(32px, 5vw, 64px)" }}
        >
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            FAQ
          </span>
          <h2 
            className="font-bold text-foreground mt-4 text-wrap-balance"
            style={{ 
              fontSize: "clamp(1.5rem, 1rem + 2.5vw, 3rem)",
              marginBottom: "clamp(12px, 2vw, 16px)",
            }}
          >
            Frequently Asked Questions
          </h2>
          <p 
            className="text-muted-foreground max-w-xl mx-auto text-break"
            style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.25vw, 1rem)" }}
          >
            Everything you need to know about Multiblock.
          </p>
        </div>

        {/* FAQ Accordion - max-width for readability */}
        <div className="max-w-3xl mx-auto">
          <Accordion 
            type="single" 
            collapsible 
            className="space-y-3"
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass-card border-border rounded-xl overflow-hidden"
                style={{ padding: "0 clamp(16px, 2.5vw, 24px)" }}
              >
                <AccordionTrigger 
                  className="text-left text-foreground hover:no-underline text-break"
                  style={{ 
                    fontSize: "clamp(0.875rem, 0.8rem + 0.2vw, 1rem)",
                    paddingTop: "clamp(16px, 2vw, 20px)",
                    paddingBottom: "clamp(16px, 2vw, 20px)",
                    minHeight: "48px",
                  }}
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent 
                  className="text-muted-foreground text-break"
                  style={{ 
                    fontSize: "clamp(0.875rem, 0.8rem + 0.2vw, 1rem)",
                    paddingBottom: "clamp(16px, 2vw, 20px)",
                    lineHeight: 1.6,
                  }}
                >
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;