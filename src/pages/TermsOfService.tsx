import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background liquid-bg">
      <div className="noise-overlay" />
      <Navbar />
      
      <main className="relative z-10 pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Effective Date: December 12, 2025</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using Multiblock Connect Your AI, you agree to these Terms. If you do not agree, do not use the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We provide a SaaS platform that allows users to create and manage AI blocks, boards, and messages using BYOK (Bring Your Own Key) for AI providers. The service includes dashboards, block canvases, API key integration, and import/export functionality.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Account Registration</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Users must provide a valid email and create an account.</li>
                  <li>You are responsible for all activity under your account.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. License Grant</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We grant you a limited, non-exclusive, non-transferable license to use our service for personal or internal business purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. User Obligations</h2>
                <p className="text-muted-foreground mb-2">You agree not to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Violate any applicable laws.</li>
                  <li>Submit harmful, illegal, or offensive content.</li>
                  <li>Attempt to access other users' data without authorization.</li>
                  <li>Misuse AI provider keys or exceed provider usage limits.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. API Keys & BYOK Responsibility</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Users provide their own AI provider keys.</li>
                  <li>Users are responsible for any charges from their AI providers.</li>
                  <li>We do not assume liability for provider outputs.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Payments & Refunds</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Refund Policy:</strong> Users may request a refund within 7 days by emailing support@multiblockconnect.com with the reason and details.</li>
                  <li>Fees are subject to change; updated pricing will be posted on the pricing page.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Third-Party Services</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our service may integrate with third-party providers (AI providers, payment processors). Use of these services is governed by their respective terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Intellectual Property</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>We retain all intellectual property rights to the platform and software.</li>
                  <li>Users retain ownership of their content.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-2">To the maximum extent permitted by law, we are not liable for:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Direct, indirect, incidental, or consequential damages.</li>
                  <li>Losses from AI provider outputs.</li>
                  <li>Financial losses due to service use or downtime.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Disclaimers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our service is provided "as is." We make no warranties regarding availability, accuracy, or results of AI outputs.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">12. Indemnification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to indemnify and hold harmless Multiblock Connect Your AI from legal claims or damages arising from your misuse.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">13. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may suspend or terminate your account for violations of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">14. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms are governed by the laws of Saudi Arabia.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">15. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may modify the Terms. Continued use of the service constitutes acceptance.
                </p>
              </section>

              <section className="border-t border-border/50 pt-8 mt-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Acceptable Use Policy (AUP)</h2>
                <p className="text-muted-foreground mb-4">Users must not:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Break laws or promote illegal content.</li>
                  <li>Input malicious, discriminatory, or harmful prompts.</li>
                  <li>Attempt unauthorized access to other accounts or systems.</li>
                  <li>Submit personal data of third parties without consent.</li>
                  <li>Abuse service functionality (spam, DDoS, repeated malicious runs).</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Users are responsible for all outputs produced using their own API keys.
                  We reserve the right to suspend accounts violating this policy.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
