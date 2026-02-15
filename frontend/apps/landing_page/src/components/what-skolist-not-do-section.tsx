export function WhatSkolistNotDoSection() {
  return (
    <section className="py-16">
      <div className="container">
        <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
          What Skolist Does NOT Do
        </h2>
        <p className="mx-auto mb-12 max-w-4xl text-center text-lg text-gray-600">
          We believe in clarity and honesty. Here&apos;s what Skolist is not:
        </p>

        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-r-lg border-l-4 border-gray-300 bg-gray-50 p-6">
            <div className="flex items-start">
              <span className="mr-3 text-xl font-bold text-gray-700">×</span>
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">
                  No Live Classes
                </h3>
                <p className="text-gray-600">
                  Skolist doesn&apos;t conduct live doubt-solving sessions or
                  teaching classes
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-r-lg border-l-4 border-gray-300 bg-gray-50 p-6">
            <div className="flex items-start">
              <span className="mr-3 text-xl font-bold text-gray-700">×</span>
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">
                  No Teacher Replacement
                </h3>
                <p className="text-gray-600">
                  We provide tools, which require teacher involvement for child
                  growth
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-r-lg border-l-4 border-blue-900 bg-blue-50 p-6">
            <div className="flex items-start">
              <svg
                className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">
                  Our Focus
                </h3>
                <p className="text-gray-700">
                  Diagnosis, strategy, and measurable improvement, empowering
                  teachers, schools, parents and students with insight
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
