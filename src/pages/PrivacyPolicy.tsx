import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
export default function PrivacyPolicy() {
  return <div className="min-h-screen bg-background liquid-bg">
      <div className="noise-overlay" />
      <Navbar />
      
      <main className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4 sm:mb-6">
            <BreadcrumbList className="text-xs sm:text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Privacy Policy</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="bg-card/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-border/50 p-5 sm:p-8 md:p-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
              Last Updated: December 12, 2025 · Effective Date: December 12, 2025
            </p>

            <div className="prose prose-invert max-w-none space-y-6 sm:space-y-8">
              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">1. Introduction</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Welcome to Multiblock. This Privacy Policy explains how we collect, use, store, and protect your personal information when you access or use our service, including our website, applications, and APIs. By using our services, you agree to this Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">2. Information We Collect</h2>
                
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 mt-4">2.1 Account Data</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3">
                  When you create an account, we collect:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Email address and username</li>
                  <li>Authentication credentials (securely hashed)</li>
                  <li>Profile information you choose to provide</li>
                  <li>Subscription and billing information</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mb-2 mt-4">2.2 Usage Data</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We automatically collect information about how you use our service:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Actions performed within the platform (creating boards, blocks, messages)</li>
                  <li>Timestamps and session duration</li>
                  <li>Run history and AI interaction logs</li>
                  <li>Feature usage patterns</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mb-2 mt-4">2.3 Storage Usage Data</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We track your storage consumption to manage plan limits:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Total storage used (measured in MB/GB)</li>
                  <li>Storage breakdown by type (messages, blocks, files)</li>
                  <li>Number of boards and blocks created</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mb-2 mt-4">2.4 AI-Generated Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Content generated through AI interactions using your API keys is stored within your account. This includes prompts sent and responses received from AI providers.
                </p>

                <h3 className="text-lg font-medium text-foreground mb-2 mt-4">2.5 Device & Browser Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>IP address and approximate location</li>
                  <li>Device type, operating system, and browser</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Data</h2>
                <p className="text-muted-foreground mb-3">We use your information to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Authenticate and manage your account</li>
                  <li>Process AI model requests via your API keys</li>
                  <li>Track and enforce storage and usage limits</li>
                  <li>Personalize your experience and provide support</li>
                  <li>Send service-related communications</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. How Storage Is Measured</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Your storage quota covers all data associated with your account:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Messages:</strong> All AI conversation history and responses</li>
                  <li><strong className="text-foreground">Blocks:</strong> Block configurations, settings, and metadata</li>
                  <li><strong className="text-foreground">Files:</strong> Any uploaded documents, images, or attachments</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Storage is displayed in your dashboard in MB or GB for easy tracking. When you approach your limit, you will receive notifications to help manage your usage.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. How Boards & Blocks Are Counted</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Each board you create counts toward your plan's board limit</li>
                  <li>Blocks within boards may have per-board limits depending on your plan</li>
                  <li>Archived boards still count toward your total</li>
                  <li>Board add-ons increase your total board limit</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. How AI Providers Process Data</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  When you use BYOK (Bring Your Own Key):
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Your prompts are sent directly to your chosen AI provider using your API key</li>
                  <li>We do not store or log the raw content sent to AI providers</li>
                  <li>AI provider data handling is governed by their respective privacy policies</li>
                  <li>Your API keys are encrypted and never shared with third parties</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Data Security</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>API keys are encrypted at rest and in transit</li>
                  <li>We use industry-standard security measures (TLS, encryption)</li>
                  <li>Access to user data is restricted to authorized personnel</li>
                  <li>Regular security audits and vulnerability assessments</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Your Rights</h2>
                <p className="text-muted-foreground mb-3">Depending on your jurisdiction, you may have rights to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Access:</strong> Request a copy of your personal data</li>
                  <li><strong className="text-foreground">Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong className="text-foreground">Deletion:</strong> Request deletion of your data</li>
                  <li><strong className="text-foreground">Portability:</strong> Export your data in a machine-readable format</li>
                  <li><strong className="text-foreground">Objection:</strong> Object to certain processing activities</li>
                  <li><strong className="text-foreground">Withdrawal:</strong> Withdraw consent at any time</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  To exercise these rights, contact us at{" "}
                  <a href="mailto:support@multiblockconnect.com" className="text-primary hover:underline">
                    support@multiblockconnect.com
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Data Retention</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>We retain your data as long as your account is active</li>
                  <li>After account deletion, data is removed within 30 days</li>
                  <li>Some data may be retained longer for legal compliance</li>
                  <li>You can request immediate deletion via account settings</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Third-Party Services</h2>
                <p className="text-muted-foreground mb-3">We may share data with:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Payment processors:</strong> Stripe, Polar for billing</li>
                  <li><strong className="text-foreground">Analytics providers:</strong> For service improvement</li>
                  <li><strong className="text-foreground">AI providers:</strong> Via your own API keys</li>
                  <li><strong className="text-foreground">Legal authorities:</strong> If required by law</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  We do not sell or rent your personal information to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We use cookies and similar technologies for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Essential:</strong> Session management and authentication</li>
                  <li><strong className="text-foreground">Analytics:</strong> Understanding how you use our service</li>
                  <li><strong className="text-foreground">Preferences:</strong> Remembering your settings</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  You can control cookie settings in your browser or through our cookie preferences in Settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">12. Age Restrictions</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from minors. If we discover that a child under 13 has provided us with personal information, we will delete it immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">13. Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy periodically. Changes will be posted on this page with an updated effective date. Continued use of our services after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">14. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about this Privacy Policy or our data practices, please contact us at:{" "}
                  <a href="mailto:support@multiblockconnect.com" className="text-primary hover:underline">
                    support@multiblockconnect.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
}