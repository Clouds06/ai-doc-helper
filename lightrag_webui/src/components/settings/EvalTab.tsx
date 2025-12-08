import React from 'react';
import { Activity } from 'lucide-react';
import { EvalStatus } from '@/types/index';
import { EvalButton } from '../common/EvalButton';
import { EvalResultDisplay } from '../common/EvalResultDisplay';
import { LoadingDisplay } from '../common/LoadingDisplay';

interface EvalTabProps {
  evalState: EvalStatus;
  onStartEvaluation: () => void;
  hasEvaluated: boolean;
}

export const EvalTab: React.FC<EvalTabProps> = ({
  evalState,
  onStartEvaluation,
  hasEvaluated,
}) => {

  // has not evaluated yet
  if (!hasEvaluated && evalState === 'idle') {
    return <EvalButton onStartEvaluation={onStartEvaluation} />;
  }

  // Loading
  if (evalState === 'loading') {
    return <LoadingDisplay icon={<Activity size={48} />} content='正在进行评测，请耐心等待...' />;
  }

  // already evaluated
  return (
    <EvalResultDisplay />
  );
};
