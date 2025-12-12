import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
export default function TermsOfService() {
  return <div className="min-h-screen bg-background liquid-bg">
      <div className="noise-overlay" />
      <Navbar />
      
      <main className="relative z-10 pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Terms of Service</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Effective Date: December 12, 2025</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">Welcome to Multiblock. These Terms of Service ("Terms") govern your access to and use of our platform, including our website, applications, APIs, and all related services. By creating an account or using our services, you agree to be bound by these Terms.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Eligibility</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You must be at least 13 years old to use our services. If you are between 13 and 18 years old, you must have parental or guardian consent. By using our services, you represent and warrant that you meet these eligibility requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Account Registration</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>You must provide accurate, complete, and current information when creating an account</li>
                  <li>You are responsible for maintaining the security of your account credentials</li>
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must notify us immediately of any unauthorized access to your account</li>
                  <li>One person or entity may not maintain multiple free accounts</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Acceptable Use</h2>
                <p className="text-muted-foreground mb-3">You agree not to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Violate any applicable laws, regulations, or third-party rights</li>
                  <li>Submit harmful, illegal, offensive, or discriminatory content</li>
                  <li>Attempt to access other users' data without authorization</li>
                  <li>Misuse AI provider keys or exceed provider usage limits</li>
                  <li>Input malicious prompts designed to exploit AI systems</li>
                  <li>Engage in spam, DDoS attacks, or repeated malicious runs</li>
                  <li>Submit personal data of third parties without their consent</li>
                  <li>Reverse engineer, decompile, or disassemble our services</li>
                  <li>Use our services to compete directly with Multiblock</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. AI Outputs Disclaimer</h2>
                <p className="text-muted-foreground leading-relaxed">
                  AI-generated content may be inaccurate, incomplete, or inappropriate. You are solely responsible for reviewing, verifying, and using any AI outputs. We do not guarantee the accuracy, reliability, or suitability of AI-generated content for any purpose. You assume all risks associated with using AI outputs.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Storage</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Your storage quota covers messages, blocks, and uploaded files. Storage limits vary by plan:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Free:</strong> 100 MB</li>
                  <li><strong className="text-foreground">Pro Plans:</strong> 5 GB - 10 GB</li>
                  <li><strong className="text-foreground">Team Plans:</strong> 20 GB - 30 GB</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  If you exceed your storage limit, you may be unable to create new content until you upgrade or delete existing data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Board & Blocks Usage Limits</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Each plan includes specific limits on boards and blocks:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Free:</strong> 1 board, 3 blocks per board</li>
                  <li><strong className="text-foreground">Pro Plans:</strong> 50-100 boards, unlimited blocks</li>
                  <li><strong className="text-foreground">Team Plans:</strong> 50-100 boards, unlimited blocks</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Board add-ons are available to increase your board limit without changing your plan. Add-ons are tied to your account and include additional storage.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Subscriptions & Billing</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong className="text-foreground">Yearly Plans:</strong> All paid plans are billed annually. Your subscription will automatically renew at the end of each billing period unless cancelled.
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Prices are subject to change with 30 days notice</li>
                  <li>You are responsible for all applicable taxes</li>
                  <li>Downgrades take effect at the end of your current billing period</li>
                  <li>Upgrades take effect immediately with prorated charges</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  See our <Link to="/refund" className="text-primary hover:underline">Refund Policy</Link> for information about cancellations and refunds.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Lifetime Deal (LTD) Offers</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>LTD purchases provide lifetime access to specified features</li>
                  <li>LTD offers are final and non-refundable</li>
                  <li>Features included in LTD offers are determined at time of purchase</li>
                  <li>Future features may or may not be included in existing LTD offers</li>
                  <li>LTD accounts are for individual or single-entity use only</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Teams & Seats Rules</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Team plans include a specified number of seats:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Each seat can be assigned to one user at a time</li>
                  <li>Seat transfers are allowed but limited to reasonable frequency</li>
                  <li>All team members are bound by these Terms</li>
                  <li>The account owner is responsible for team members' compliance</li>
                  <li>Storage limits are shared across all team members</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Intellectual Property</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>We retain all rights to the Multiblock platform, software, and branding</li>
                  <li>You retain ownership of content you create using our services</li>
                  <li>You grant us a license to host, display, and process your content to provide our services</li>
                  <li>AI-generated content ownership follows the terms of the respective AI provider</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">12. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  To the maximum extent permitted by law, Multiblock shall not be liable for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Any indirect, incidental, special, or consequential damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Damages arising from AI provider outputs or actions</li>
                  <li>Service interruptions or data loss</li>
                  <li>Third-party actions or content</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">13. Termination</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>You may terminate your account at any time through account settings</li>
                  <li>We may suspend or terminate accounts for violations of these Terms</li>
                  <li>We may terminate accounts that remain inactive for extended periods</li>
                  <li>Upon termination, your right to use the services ceases immediately</li>
                  <li>Data retention after termination is governed by our Privacy Policy</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">14. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms are governed by the laws of Saudi Arabia. Any disputes shall be resolved in the courts of Saudi Arabia, and you consent to the exclusive jurisdiction of such courts.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">15. Changes to These Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may modify these Terms at any time. Material changes will be communicated via email or in-app notification at least 30 days before taking effect. Continued use of our services after changes take effect constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">16. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms, please contact us at{" "}
                  <a href="mailto:support@multiblockconnect.com" className="text-primary hover:underline">
                    support@multiblockconnect.com
                  </a>
                </p>
              </section>

              <section className="border-t border-border/50 pt-8 mt-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Acceptable Use Policy (AUP)</h2>
                <p className="text-muted-foreground mb-4">
                  This Acceptable Use Policy is incorporated into and forms part of the Terms of Service. Users must comply with this policy at all times.
                </p>
                <p className="text-muted-foreground mb-4">Users must not:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Break laws or promote illegal content</li>
                  <li>Input malicious, discriminatory, or harmful prompts</li>
                  <li>Attempt unauthorized access to other accounts or systems</li>
                  <li>Submit personal data of third parties without consent</li>
                  <li>Abuse service functionality (spam, DDoS, repeated malicious runs)</li>
                  <li>Circumvent usage limits or security measures</li>
                  <li>Use the service to harass, threaten, or harm others</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Users are responsible for all outputs produced using their own API keys. We reserve the right to suspend or terminate accounts violating this policy without notice or refund.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
}