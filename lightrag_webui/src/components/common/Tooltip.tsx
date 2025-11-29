import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  text: string;
  className?: string;
}

export const Tooltip = ({ text, className }: TooltipProps) => {
  return (
    <div className={cn('relative group/tooltip flex-shrink-0 ml-2', className)}>
      <HelpCircle className="w-3 h-3 text-gray-300 group-hover/tooltip:text-indigo-500 transition-colors" />
      <div className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 px-2 py-1 bg-gray-900 text-[10px] text-white rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 whitespace-normal max-w-[220px] z-10">
        {text}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900" />
      </div>
    </div>
  );
}
