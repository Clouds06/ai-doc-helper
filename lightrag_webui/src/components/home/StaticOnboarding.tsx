import React, { useCallback, useState, useEffect } from 'react';
import { X, UploadCloud, Cpu, MessageSquare, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'rag-onboarding-visible';

export default function StaticOnboarding({
  defaultOpen = true,
  className,
  onToggle,
}: StaticOnboardingProps) {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState !== null) {
        setIsOpen(JSON.parse(savedState));
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isOpen));
    }
  }, [isOpen, isLoaded]);

  const handleToggle = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onToggle?.(open);
    },
    [onToggle]
  );

  if (!isOpen) {
    return (
      <div className={cn('w-full mb-6 animate-in fade-in slide-in-from-top-2 duration-300', className)}>
        <ToggleButton onOpen={() => handleToggle(true)} />
      </div>
    );
  }

  return (
    <div className={cn('w-full mb-6 animate-in fade-in slide-in-from-top-2 duration-300', className)}>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative">
        <OnboardingHeader onClose={() => handleToggle(false)} isOpen={isOpen} />
        <StepsList steps={steps} />
      </div>
    </div>
  );
}

type StaticOnboardingProps = {
  defaultOpen?: boolean;
  className?: string;
  onToggle?: (open: boolean) => void;
};

type StepColor = 'blue' | 'orange' | 'green';

export type Step = {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: StepColor;
};

const steps: Step[] = [
  {
    id: 1,
    title: '1. 上传文档',
    subtitle: 'MD / DOCX / TXT 等',
    icon: <UploadCloud className="w-5 h-5" />,
    color: 'orange',
  },
  {
    id: 2,
    title: '2. 等待处理',
    subtitle: 'AI 解析与学习',
    icon: <Cpu className="w-5 h-5" />,
    color: 'blue',
  },
  {
    id: 3,
    title: '3. 开始问答',
    subtitle: '精准检索与对话',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'green',
  },
];

const colorMap: Record<
  StepColor,
  { bg: string; border: string; text: string }
> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-500' },
  green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600' },
};

function ToggleButton({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex justify-center mb-4">
      <button
        type="button"
        onClick={onOpen}
        className="group inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
        aria-label="打开新手引导"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>新手引导</span>
      </button>
    </div>
  );
}

function OnboardingHeader({ onClose, isOpen }: { onClose: () => void; isOpen: boolean }) {
  return (
    <div className="flex justify-between items-start mb-5">
      <div>
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />快速上手指南
        </h2>
        <p className="text-xs text-gray-600 mt-1 pl-3.5">构建你的专属 AI 知识库</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-md transition-colors"
        title="关闭引导"
        aria-label="关闭新手引导"
        aria-expanded={isOpen}
        aria-controls="static-onboarding-steps"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const StepItem = React.memo(function StepItem({ step }: { step: Step }) {
  const colors = colorMap[step.color];

  return (
    <div className="flex flex-col items-center gap-2 relative z-10 flex-shrink-0">
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105',
          colors.bg,
          colors.border,
          colors.text
        )}
      >
        {step.icon}
      </div>
      <div className="text-center">
        <span className="block text-xs font-semibold text-gray-800">{step.title}</span>
        <span className="block text-xs text-gray-500 mt-0.5">{step.subtitle}</span>
      </div>
    </div>
  );
});

const ConnectorLine = () => (
  <div className="flex-1 h-px bg-gray-300 mx-2 -mt-6 relative">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
      <ArrowRight className="w-3 h-3 text-gray-400" />
    </div>
  </div>
);

function StepsList({ steps }: { steps: Step[] }) {
  return (
    <div
      id="static-onboarding-steps"
      className="flex items-center relative px-2"
      aria-label="新手引导流程图"
    >
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <StepItem step={step} />
          {idx < steps.length - 1 && <ConnectorLine />}
        </React.Fragment>
      ))}
    </div>
  );
}
