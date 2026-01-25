import DemoForm from "../components/DemoForm";
import { LINKS } from "../constants/links";
import { FaWhatsapp } from "react-icons/fa";

export function ContactPage() {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Let&apos;s Talk
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              We&apos;d love to show you how Skolist can help your school
              identify learning gaps and guide every student to success. Book a
              demo or get in touch with our founders.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2">
            {/* Contact Form */}
            <div>
              <DemoForm />
            </div>

            {/* Additional Information */}
            <div className="space-y-8">
              <div>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  What to Expect
                </h2>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex gap-3">
                    <span className="font-bold text-[#0A1F44]">1.</span>
                    <span>
                      <strong>Quick Response:</strong> We&apos;ll get back to
                      you within 24 hours to schedule a conversation.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#0A1F44]">2.</span>
                    <span>
                      <strong>Personalized Demo:</strong> We&apos;ll walk you
                      through Skolist and discuss your school&apos;s specific
                      needs.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#0A1F44]">3.</span>
                    <span>
                      <strong>Custom Pilot Plan:</strong> If it&apos;s a good
                      fit, we&apos;ll design a pilot program tailored to your
                      school.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg bg-gray-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  Who Should Reach Out?
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ School principals and leadership teams</li>
                  <li>✓ Academic coordinators</li>
                  <li>✓ Curriculum heads</li>
                  <li>✓ Teachers interested in personalized learning</li>
                  <li>✓ Anyone curious about how Skolist works</li>
                </ul>
              </div>

              <div className="rounded-lg border border-[#0A1F44] bg-[#e6eaf2] p-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Join Our Community
                </h3>
                <p className="mb-4 text-sm text-gray-700">
                  Connect with other educators and our founding team on
                  WhatsApp. Get updates and discuss directly.
                </p>
                <a
                  href={LINKS.WHATSAPP_GROUP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-bold text-[#0A1F44] hover:underline"
                >
                  Join WhatsApp Group <FaWhatsapp className="inline" /> →
                </a>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-1 font-medium text-gray-900">
                      Is there a cost for the pilot?
                    </h4>
                    <p className="text-sm text-gray-600">
                      No, the pilot program is completely free. We want to
                      ensure Skolist meets your school&apos;s needs before any
                      commitment.
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-1 font-medium text-gray-900">
                      What subjects does Skolist cover?
                    </h4>
                    <p className="text-sm text-gray-600">
                      We&apos;re starting with core subjects and expanding based
                      on school needs. Let&apos;s discuss what works for your
                      school.
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-1 font-medium text-gray-900">
                      How long is the demo?
                    </h4>
                    <p className="text-sm text-gray-600">
                      Typically 30-45 minutes. We&apos;ll tailor it to your
                      schedule and questions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
