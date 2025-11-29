import React from 'react';
import { Activity } from 'lucide-react';
import type { SavedParamsSnapshot } from './SettingsModal';
import { EvalStatus } from '@/types/index';
import { EvalButton } from '../common/EvalButton';
import { EvalResultDisplay } from '../common/EvalResultDisplay';
import { LoadingDisplay } from '../common/LoadingDisplay';

interface EvalTabProps {
  evalState: EvalStatus;
  onStartEvaluation: () => void;
  hasEvaluated: boolean;
  lastEvalParams: SavedParamsSnapshot | null;
  isEvalButtonDisabled: boolean;
}

export const EvalTab: React.FC<EvalTabProps> = ({
  evalState,
  onStartEvaluation,
  hasEvaluated,
  lastEvalParams,
  isEvalButtonDisabled,
}) => {
  // has not evaluated yet
  if (!hasEvaluated && evalState === 'idle') {
    return <EvalButton onStartEvaluation={onStartEvaluation} />;
  }

  // Loading
  if (evalState === 'loading') {
    return <LoadingDisplay icon={<Activity size={48} />} content='正在评估模型表现...' />;
  }

  // already evaluated
  return (
    <EvalResultDisplay
      lastEvalParams={lastEvalParams}
      isEvalButtonDisabled={isEvalButtonDisabled}
      hasEvaluated={hasEvaluated}
      onStartEvaluation={onStartEvaluation}
    />
  );
};
