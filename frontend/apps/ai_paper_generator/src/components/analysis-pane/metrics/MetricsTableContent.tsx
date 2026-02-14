import {
  type MetricRow,
  TAB_LABELS,
  type TabType,
} from "../../../hooks/useDetailedMetrics";

interface MetricsTableContentProps {
  activeTab: TabType;
  metrics: MetricRow[];
  grandTotal: {
    easy: number;
    medium: number;
    hard: number;
    total: number;
  };
}

export function MetricsTableContent({
  activeTab,
  metrics,
  grandTotal,
}: MetricsTableContentProps) {
  return (
    <div className="mt-0 w-full overflow-hidden rounded-b-lg border border-t-0 border-gray-400">
      <div className="h-[280px] overflow-auto">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="sticky top-0 bg-gray-50 text-muted-foreground">
            <tr className="border-b border-gray-400">
              <th className="h-10 w-[35%] px-4 font-medium">
                {TAB_LABELS[activeTab]}
              </th>
              <th className="h-10 w-[15%] px-4 text-center font-medium">
                Easy
              </th>
              <th className="h-10 w-[15%] px-4 text-center font-medium">
                Medium
              </th>
              <th className="h-10 w-[15%] px-4 text-center font-medium">
                Hard
              </th>
              <th className="h-10 w-[20%] px-4 text-center font-medium">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.length === 0 ? (
              <tr className="border-b">
                <td
                  colSpan={5}
                  className="h-24 p-4 text-center text-muted-foreground"
                >
                  No questions in draft. Add questions to draft to see metrics.
                </td>
              </tr>
            ) : (
              metrics.map((metric, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                >
                  <td className="w-[40%] p-4 font-medium text-gray-800">
                    {metric.name}
                  </td>
                  <td className="w-[15%] p-4 text-center text-gray-600">
                    {metric.easy > 0 ? metric.easy : "-"}
                  </td>
                  <td className="w-[15%] p-4 text-center text-gray-600">
                    {metric.medium > 0 ? metric.medium : "-"}
                  </td>
                  <td className="w-[15%] p-4 text-center text-gray-600">
                    {metric.hard > 0 ? metric.hard : "-"}
                  </td>
                  <td className="w-[15%] p-4 text-center font-medium text-gray-800">
                    {metric.total}
                    <span className="pl-2 text-xs text-gray-500">
                      (
                      {grandTotal.total > 0
                        ? Math.round((metric.total / grandTotal.total) * 100)
                        : 0}
                      %)
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Grand Total Row */}
      <table className="w-full table-fixed border-t border-gray-200 bg-green-50 text-left text-sm">
        <tbody>
          <tr>
            <td className="w-[40%] p-4 font-medium text-green-700">
              Grand Total
            </td>
            <td className="w-[15%] p-4 text-center font-medium text-green-600">
              {grandTotal.easy}
            </td>
            <td className="w-[15%] p-4 text-center font-medium text-green-600">
              {grandTotal.medium}
            </td>
            <td className="w-[15%] p-4 text-center font-medium text-green-600">
              {grandTotal.hard}
            </td>
            <td className="w-[15%] p-4 text-center font-medium text-green-700">
              {grandTotal.total}
              <span className="pl-2 text-xs text-green-600">(100%)</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
