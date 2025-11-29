
import { CardTab } from '@/types';

interface CardTabsProps {
  tabs: CardTab[];
  activeTab: string;
  onClick: (next: string) => void;
}

export const CardTabs = ({
  tabs,
  activeTab,
  onClick,
} : CardTabsProps) => {
  return (
    <div className="flex items-center gap-1 px-6 pt-2 border-b border-gray-100 bg-white/80">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onClick(tab.id)}
          className={
            'relative px-4 py-3 text-sm font-medium transition-all ' +
          (tab.id === activeTab
            ? 'text-indigo-600'
            : 'text-gray-500 hover:text-gray-700')
          }
        >
          {tab.label}
          {tab.id === activeTab && (
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
};
