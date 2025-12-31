import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background liquid-bg">
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
                <BreadcrumbPage>Refund Policy</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="bg-card/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-border/50 p-5 sm:p-8 md:p-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Refund Policy</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
              Last Updated: December 12, 2025 · Effective Date: December 12, 2025
            </p>

            <div className="prose prose-invert max-w-none space-y-6 sm:space-y-8">
              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">1. Refund Eligibility</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Refunds are available within <strong className="text-foreground">7 days</strong> of your initial
                  purchase date. This policy applies to yearly subscription plans only.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. How to Request a Refund</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To request a refund, please email us at{" "}
                  <a href="mailto:support@multiblockconnect.com" className="text-primary hover:underline">
                    support@multiblockconnect.com
                  </a>{" "}
                  with the following information:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>
                    <strong className="text-foreground">Reason for refund:</strong> A brief explanation of why you are
                    requesting a refund.
                  </li>
                  <li>
                    <strong className="text-foreground">Plan purchased:</strong> The name of the subscription plan you
                    purchased (e.g., Pro $99/year, Team $129/year).
                  </li>
                  <li>
                    <strong className="text-foreground">Account email:</strong> The email address associated with your
                    Multiblock account.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Yearly Subscriptions</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Refunds are only applicable to yearly subscription plans (Pro and Team plans). Refund requests must be
                  submitted within 7 days of the original purchase date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Lifetime Deal (LTD) Purchases</h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">LTD purchases are final and non-refundable.</strong> Due to the
                  discounted nature of lifetime deals, we are unable to process refunds for these purchases. Please
                  carefully review the features and limitations before purchasing an LTD offer.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Retention After Refund</h2>
                <p className="text-muted-foreground leading-relaxed">
                  After a refund is processed, your stored data (boards, blocks, messages, and files) will remain in
                  your account until you choose to delete it. Your account will be downgraded to the Free plan, and
                  storage limits will apply accordingly. Data exceeding Free plan limits may become inaccessible until
                  you upgrade or delete excess data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Abuse Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to decline refund requests in cases of suspected abuse. This includes, but is not
                  limited to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                  <li>Repeated refund requests across multiple accounts</li>
                  <li>Excessive usage of the service before requesting a refund</li>
                  <li>Attempts to circumvent subscription limits through refund cycles</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Abuse of the refund policy may result in account suspension or termination.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Refund Processing</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Approved refunds will be issued to your original payment method. Please allow 2-7 business days for
                  the refund to appear in your account, depending on your payment provider.
                  <strong className="text-foreground">original payment method</strong>. Please allow 5-10 business days
                  for the refund to appear in your account, depending on your payment provider.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Board Add-ons</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Board add-on purchases are non-refundable once activated. If you have purchased board add-ons and
                  request a subscription refund, the add-ons will be forfeited and cannot be transferred to another
                  account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about our refund policy, please contact us at{" "}
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
    </div>
  );
}
