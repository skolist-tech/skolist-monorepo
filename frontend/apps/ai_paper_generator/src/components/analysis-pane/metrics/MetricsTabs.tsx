import { ChevronLeft, ChevronRight } from "lucide-react";
import { type TabType, TAB_LABELS } from "../../../hooks/useDetailedMetrics";

interface MetricsTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  tabs: TabType[];
  currentTabIndex: number;
  handlePrevTab: () => void;
  handleNextTab: () => void;
}

export function MetricsTabs({
  activeTab,
  setActiveTab,
  tabs,
  currentTabIndex,
  handlePrevTab,
  handleNextTab,
}: MetricsTabsProps) {
  return (
    <>
      {/* Navigation Arrows - hidden on mobile */}
      <button
        onClick={handlePrevTab}
        disabled={currentTabIndex === 0}
        className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition-all hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 md:flex"
        aria-label="Previous tab"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={handleNextTab}
        disabled={currentTabIndex === tabs.length - 1}
        className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition-all hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 md:flex"
        aria-label="Next tab"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Chrome-like Tabs */}
      <div className="flex items-end gap-0 overflow-x-auto border-b border-gray-400">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-all md:px-6 md:py-2.5 ${
              activeTab === tab
                ? "z-10 -mb-px rounded-t-lg border border-gray-400 border-b-white bg-white text-gray-900"
                : "rounded-t-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            } `}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
    </>
  );
}
