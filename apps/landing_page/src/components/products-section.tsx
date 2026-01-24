import { FileText, Check, Scan, Bell, GitBranch } from "lucide-react";

const products = [
  {
    name: "QGen",
    icon: FileText,
    description: "Question Paper Generator",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    borderColor: "border-l-blue-500",
    shadowColor: "hover:shadow-blue-200/50",
  },
  {
    name: "Checker",
    icon: Check,
    description: "Smart Answer Validation",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    borderColor: "border-l-emerald-500",
    shadowColor: "hover:shadow-emerald-200/50",
  },
  {
    name: "Strategy",
    icon: GitBranch,
    description: "Personalized Learning Path Optimizer",
    color: "bg-violet-500",
    lightColor: "bg-violet-50",
    borderColor: "border-l-violet-500",
    shadowColor: "hover:shadow-violet-200/50",
  },
  {
    name: "Notifier",
    icon: Bell,
    description: "Real-time Alerts",
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    borderColor: "border-l-orange-500",
    shadowColor: "hover:shadow-orange-200/50",
  },
  {
    name: "AI Tutor",
    icon: Scan,
    description: "Personalized Guidance",
    color: "bg-rose-500",
    lightColor: "bg-rose-50",
    borderColor: "border-l-rose-500",
    shadowColor: "hover:shadow-rose-200/50",
  },
];

export function ProductsSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-sky-400 to-sky-600 py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Our Products
          </h2>
          <p className="mx-auto max-w-2xl text-lg font-medium text-white/95">
            A comprehensive suite of technologically empowered tools designed to
            transform education
          </p>
        </div>

        {/* Products Grid */}
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:gap-8">
          {products.map((product, index) => (
            <div
              key={product.name}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border-l-4 ${product.borderColor} bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-2 ${product.shadowColor} hover:shadow-2xl md:p-6 ${
                index === 4 ? "col-span-2 md:col-span-1" : ""
              }`}
            >
              {/* Card Content */}
              <div className="relative z-10">
                {/* Icon with Colored Background */}
                <div
                  className={`mb-4 inline-flex rounded-xl ${product.color} p-3 shadow-lg`}
                >
                  <product.icon
                    className="h-6 w-6 text-white"
                    strokeWidth={2}
                  />
                </div>

                {/* Product Name */}
                <h3 className="mb-1 text-xl font-bold text-gray-900 md:text-2xl">
                  {product.name}
                </h3>

                {/* Product Description */}
                <p className="text-sm font-medium text-gray-600">
                  {product.description}
                </p>
              </div>

              {/* Decorative Corner */}
              <div
                className={`absolute -bottom-8 -right-8 h-24 w-24 rounded-full ${product.lightColor} opacity-50 transition-all duration-300 group-hover:scale-150 group-hover:opacity-80`}
              />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="mb-6 font-medium text-white/90">
            All tools work seamlessly together for maximum impact
          </p>
          <a
            href="https://qgen.skolist.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
            QGen is Live — Try it now!
          </a>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/80">
            Instantly choose from millions of questions with auto-formatting
          </p>
        </div>
      </div>
    </section>
  );
}
