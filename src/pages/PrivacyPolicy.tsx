import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background liquid-bg">
      <div className="noise-overlay" />
      <Navbar />
      
      <main className="relative z-10 pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">
              Last Updated: December 12, 2025 · Effective Date: December 12, 2025
            </p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Multiblock Connect Your AI ("we," "us," "our"). This Privacy Policy explains how we collect, use, store, and protect your personal information when you access or use our service, including our website, applications, and APIs. By using our services, you agree to this Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
                
                <h3 className="text-lg font-medium text-foreground mb-2">2.1 Personal Information You Provide</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li><strong className="text-foreground">Account Data:</strong> Email, username, and authentication information.</li>
                  <li><strong className="text-foreground">User Content:</strong> Boards, blocks, messages, and imported files you create or upload.</li>
                  <li><strong className="text-foreground">API Keys (BYOK):</strong> Provider keys you enter for AI model usage are encrypted and never shared outside of the provider connection.</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mb-2">2.2 Automatically Collected Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Usage and analytics data: actions, timestamps, run history.</li>
                  <li>Device and browser information: IP address, device type, OS, browser.</li>
                  <li>Cookies and similar technologies for session management, analytics, and personalization.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-2">We use your data to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide, maintain, and improve our services.</li>
                  <li>Authenticate and manage your account.</li>
                  <li>Process AI model requests via your API keys.</li>
                  <li>Personalize your experience and provide support.</li>
                  <li>Comply with legal obligations.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Encryption & Security</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>API keys you provide are encrypted and stored securely.</li>
                  <li>Keys are used only to interact with the selected AI provider and never exposed to other users.</li>
                  <li>We implement technical and organizational measures to safeguard your data.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Retention</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>We retain your data only as long as necessary to provide services and meet legal requirements.</li>
                  <li>You may request data deletion at any time via your account settings or by contacting support.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Sharing</h2>
                <p className="text-muted-foreground mb-2">We do not sell or rent your personal information. We may share data with:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Payment processors (e.g., Polar, Stripe)</li>
                  <li>Analytics providers</li>
                  <li>Legal authorities if required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
                <p className="text-muted-foreground mb-2">Depending on your jurisdiction, you may have rights to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Access, correct, or delete your data.</li>
                  <li>Object to or restrict processing.</li>
                  <li>Withdraw consent at any time.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use cookies for session management, analytics, and personalization. You can control cookie settings in your browser.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our services are not intended for children under 13. We do not knowingly collect data from minors.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy. Updates will be posted on this page with an updated effective date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Email: <a href="mailto:support@multiblockconnect.com" className="text-primary hover:underline">support@multiblockconnect.com</a>
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
