import { Check, X } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

interface ComparisonRow {
  feature: string;
  multiblock: string | boolean;
  chatgpt: string | boolean;
  claude: string | boolean;
}

const rows: ComparisonRow[] = [
  { feature: 'Multiple AI Models', multiblock: true, chatgpt: false, claude: false },
  { feature: 'Persistent Context / Memory', multiblock: true, chatgpt: false, claude: false },
  { feature: 'Visual Board Canvas', multiblock: true, chatgpt: false, claude: false },
  { feature: 'Connected AI Blocks', multiblock: true, chatgpt: false, claude: false },
  { feature: 'Bring Your Own API Key', multiblock: true, chatgpt: false, claude: false },
  { feature: 'Team Collaboration', multiblock: true, chatgpt: 'Enterprise only', claude: 'Enterprise only' },
  { feature: 'Unlimited Messages', multiblock: true, chatgpt: 'Paid only', claude: 'Paid only' },
  { feature: 'Data Export', multiblock: true, chatgpt: false, claude: false },
  { feature: 'Starting Price', multiblock: 'Free / $19/mo', chatgpt: '$20/mo', claude: '$20/mo' },
];

function renderCell(value: string | boolean) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <div className="check-icon-3d" style={{ width: 22, height: 22 }}>
          <Check className="h-3 w-3 text-accent" />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <div className="x-icon-3d" style={{ width: 22, height: 22 }}>
          <X className="h-3 w-3 text-muted-foreground/40" />
        </div>
      </div>
    );
  }
  return <span className="text-xs sm:text-sm font-medium text-foreground">{value}</span>;
}

const Comparison = () => {
  return (
    <section className="relative dot-grid-bg py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection delay={0} className="text-center mb-6 sm:mb-8 md:mb-10">
          <span className="section-badge mb-4">
            Why Multiblock
          </span>
          <h2 className="font-display italic font-bold text-foreground mt-4 text-wrap-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
            Multiblock vs Others
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-break text-sm sm:text-base">
            See how Multiblock compares to single-model tools.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <div className="pricing-card-default rounded-2xl p-4 sm:p-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-4 pr-4 text-sm font-semibold text-muted-foreground">Features</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-accent">Multiblock</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-muted-foreground">ChatGPT</th>
                  <th className="py-4 pl-4 text-center text-sm font-semibold text-muted-foreground">Claude</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-border/10 ${i % 2 === 0 ? 'bg-muted/5' : ''}`}
                  >
                    <td className="py-3 pr-4 text-xs sm:text-sm font-medium text-foreground">{row.feature}</td>
                    <td className="py-3 px-4 text-center">{renderCell(row.multiblock)}</td>
                    <td className="py-3 px-4 text-center">{renderCell(row.chatgpt)}</td>
                    <td className="py-3 pl-4 text-center">{renderCell(row.claude)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Comparison;
