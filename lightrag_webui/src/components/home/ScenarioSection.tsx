import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { ALL_SCENARIOS, THEME_STYLES } from '../../data/mock';

interface ScenarioSectionProps {
  onSearch: (query: string) => void;
}

export const ScenarioSection = ({ onSearch }: ScenarioSectionProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-gray-400 text-xs font-medium flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-blue-400" />可以这样问</h3>
        <button className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"><RefreshCw className="w-3 h-3" />换一批</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ALL_SCENARIOS.slice(0, 3).map((demo) => {
          const style = THEME_STYLES[demo.theme];
          return (
            <button key={demo.id} onClick={() => onSearch(demo.query)} className="group text-left p-3 bg-white border border-gray-100 hover:border-blue-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
              <div className="flex items-start justify-between mb-2 relative z-10">
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${style.bg} ${style.text} ${style.hoverBg} ${style.hoverText}`}>{demo.icon}</div>
                <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <h4 className="text-gray-800 font-medium text-xs mb-1 line-clamp-1 relative z-10">{demo.title}</h4>
              <p className="text-gray-400 text-[10px] line-clamp-1 group-hover:text-gray-500 relative z-10">{demo.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
