import { FileText, Check, Scan, Bell, GitBranch } from "lucide-react";

const products = [
  { name: "QGen", icon: FileText },
  { name: "Checker", icon: Check },
  { name: "AI Tutor", icon: Scan },
  { name: "Notifier", icon: Bell },
  { name: "Strategy", icon: GitBranch },
];

export function ProductsSection() {
  return (
    <section className="bg-[#EBF5FF] py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">
          Our Products
        </h2>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {products.map((product) => (
            <div
              key={product.name}
              className="group flex w-[calc(50%-8px)] cursor-pointer items-center gap-3 rounded-2xl border border-gray-50 bg-white px-4 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:gap-4 sm:px-8 sm:py-5 md:w-auto"
            >
              <div className="rounded-lg bg-gray-50 p-2 transition-colors group-hover:bg-blue-50">
                <product.icon
                  className="h-5 w-5 text-gray-700 transition-colors group-hover:text-blue-600"
                  strokeWidth={2.5}
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                {product.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
