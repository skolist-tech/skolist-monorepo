import { Target, BarChart3, BrainCircuit, Zap, SearchCode } from 'lucide-react';

const cards = [
  {
    title: "Strategic Improvement Focused on Root Causes",
    description: "Students practice and improve weak areas through continuous, personalized diagnosis with our AI doubt solver.",
    icon: <Target className="w-6 h-6 text-blue-600" />,
    className: "lg:col-span-7 bg-blue-50/50",
  },
  {
    title: "Actionable Insights",
    description: "Clear reports on each student's progress for targeted interventions.",
    icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
    className: "lg:col-span-5 bg-slate-50",
  },
  {
    title: "AI-Generated Strategy",
    description: "Curriculum-based personalized plans for every student, customizable by teachers.",
    icon: <BrainCircuit className="w-6 h-6 text-blue-600" />,
    className: "lg:col-span-4 bg-slate-50",
  },
  {
    title: "Hassle-Free Integration",
    description: "Agentic AI models complete setup in clicks. No technical knowledge required.",
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    className: "lg:col-span-4 bg-blue-50/50",
  },
  {
    title: "Exact Weak Concepts",
    description: "Pinpoint specific topics beyond just scores to reveal true root causes.",
    icon: <SearchCode className="w-6 h-6 text-indigo-600" />,
    className: "lg:col-span-4 bg-indigo-50/30",
  },
];

export function HowSkolistHelpsSection() {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="max-w-3xl mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            How Skolist <span className="text-blue-600">Helps</span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Skolist makes learning gaps visible and actionable through
            personalized strategy and intelligent hassle-free integration.
          </p>
        </div>

        {/* Modern Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {cards.map((card, idx) => (
            <div
              key={card.title}
              className={`group relative overflow-hidden rounded-[2rem] p-8 border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 ${card.className}`}
            >
              {/* Subtle Background Pattern or Glow */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/50 rounded-full blur-2xl group-hover:bg-blue-200/50 transition-colors" />
              
              <div className="relative z-10">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium text-[15px]">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}