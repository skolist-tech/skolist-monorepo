import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-[#0A325F] pb-6 pt-14 text-white md:pb-12 md:pt-36">
      <div className="container mx-auto px-4">
        <div className="mb-8 grid grid-cols-1 gap-6 text-center md:mb-16 md:grid-cols-3 md:gap-12 md:text-left">
          {/* Logo & About */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-2 text-lg font-bold md:mb-4 md:text-xl">
              Skolist
            </h3>
            <p className="max-w-xs text-xs leading-relaxed text-blue-200">
              Empowering Schools to Provide Personalized Strategy-Based Learning
              for Every Child&apos;s Better Future
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center">
            <h3 className="mb-3 text-lg font-bold md:mb-6 md:text-xl">
              Quick Links
            </h3>
            <div className="flex gap-8 text-sm font-medium text-blue-100">
              <Link to="/" className="transition-colors hover:text-white">
                Home
              </Link>
              <Link to="/vision" className="transition-colors hover:text-white">
                Vision
              </Link>
              <Link
                to="/contact"
                className="transition-colors hover:text-white"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-end">
            <h3 className="mb-2 text-lg font-bold md:mb-4 md:text-xl">
              Contact Us
            </h3>
            <a
              href="mailto:info@skolist.com"
              className="text-xs text-blue-100 transition-colors hover:text-white"
            >
              info@skolist.com
            </a>
          </div>
        </div>

        <div className="border-t border-blue-900/50 md:pt-8 text-center">
          <p className="text-[10px] font-medium text-blue-300">
            2025 Skolist. Built by IIT Founders.
          </p>
        </div>
      </div>
    </footer>
  );
}
