import { HeroSearchCard } from '../components/home/HeroSearchCard';
import StaticOnboarding from '../components/home/StaticOnboarding';

interface HomeViewProps {
  onSearch: (query: string) => void;
}

export const HomeView = ({ onSearch }: HomeViewProps) => {
  const handleSearchAttempt = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative overflow-y-auto">
      <div className="flex flex-col w-full max-w-3xl mx-auto px-4 min-h-full transition-all duration-500 ease-in-out justify-center pb-20">
        <div className="items-center text-center mb-8 mt-12">
          {/* <h1 className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent font-base text-3xl">懂你的文件问答助手</h1> */}
          <h1 className="font-bold text-3xl">懂你的文件问答助手</h1>
        </div>
        <HeroSearchCard onSearch={handleSearchAttempt} />
        <StaticOnboarding />
      </div>
    </div>
  );
};
