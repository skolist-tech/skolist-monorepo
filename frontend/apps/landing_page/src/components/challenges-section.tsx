export function ChallengesSection() {
  return (
    <section className="py-16">
      <div className="container">
        <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
          The Real Challenges Schools Face Today
        </h2>
        <p className="mx-auto mb-12 max-w-4xl text-center text-lg text-gray-600">
          Students score low but don&apos;t know the why. Teachers want to help
          but can&apos;t personalize guidance for every student, eroding
          parents&apos; trust in schools
        </p>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-8">
            <h3 className="mb-3 text-xl font-bold text-gray-900">
              No Visibility into Gaps
            </h3>
            <p className="text-gray-600">
              Students fail repeatedly without understanding their weak concepts
              or root causes
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-8">
            <h3 className="mb-3 text-xl font-bold text-gray-900">
              One-Size-Fits-All Tests
            </h3>
            <p className="text-gray-600">
              Same tests and content for everyone, regardless of individual
              learning needs.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-8">
            <h3 className="mb-3 text-xl font-bold text-gray-900">
              Overwhelmed Teachers
            </h3>
            <p className="text-gray-600">
              Teachers lack the tools and time to diagnose and address each
              student&apos;s specific struggles.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-8">
            <h3 className="mb-3 text-xl font-bold text-gray-900">
              No Actionable Insights
            </h3>
            <p className="text-gray-600">
              Schools have scores but no system that shows what to fix or how to
              improve.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
