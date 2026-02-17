import { useState } from "react";

export const UnitTestExample = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="rounded border p-4">
      <h2 className="mb-2 text-xl font-bold">Unit Test Example</h2>
      <p data-testid="count-display">Count: {count}</p>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="mt-2 rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
      >
        Increment
      </button>
    </div>
  );
};
