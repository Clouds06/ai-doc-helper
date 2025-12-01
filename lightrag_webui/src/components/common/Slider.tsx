import React, { useState } from 'react';

interface SliderProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  minLabel?: string;
  maxLabel?: string;
  description?: string;
  showValue?: boolean;
  className?: string;
}

const DEFAULT_SLIDER_CLASSNAME = 'h-2 w-full bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600';
const DEFAULT_VALUE_DISPLAY_DURATION = 2000; // in milliseconds

const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  description,
  showValue = true,
  className = DEFAULT_SLIDER_CLASSNAME,
}) => {
  const [showValueAbove, setShowValueAbove] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
    setShowValueAbove(true);
    setFadeOut(false);

    // Fade out the value after a short duration
    setTimeout(() => {
      setFadeOut(true);
    }, DEFAULT_VALUE_DISPLAY_DURATION);
  };

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center gap-4">
        {minLabel && <span className="text-xs font-medium text-gray-400">{minLabel}</span>}
        <div className="relative flex-1">
          {showValue && showValueAbove && (
            <div
              className={`absolute z-10 -top-2 -translate-y-full -translate-x-1/2 px-2 py-0.5 rounded bg-indigo-600 text-white text-xs font-mono shadow pointer-events-none transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
              style={{ left: `${pct}%` }}
            >
              {value}
            </div>
          )}
          {/* Slider Input */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className={className}
          />
        </div>
        {maxLabel && <span className="text-xs font-medium text-gray-400">{maxLabel}</span>}
      </div>
      {description && (
        <p className="text-xs text-gray-400 mt-2 text-center">{description}</p>
      )}
    </div>
  );
};

export default Slider;
