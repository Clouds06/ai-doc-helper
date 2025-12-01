import { useState } from 'react';

type NumberInputProps = {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
};

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(value.toString());

  const handleInputChange = (e: { target: { value: any; }; }) => {
    const inputValue = e.target.value;

    if (inputValue === '') {
      setLocalValue('');
      return;
    }

    const numValue = Number(inputValue);

    if (isNaN(numValue)) return;

    if (numValue > max) {
      setLocalValue(max.toString());
      if (onChange) onChange(max);
    } else if (numValue < min && inputValue !== '') {
      setLocalValue(min.toString());
      if (onChange) onChange(min);
    } else {
      setLocalValue(inputValue);
      if (onChange) onChange(numValue);
    }
  };

  const handleBlur = () => {
    let finalValue = Number(localValue);

    if (localValue === '' || finalValue < min) {
      finalValue = min;
    }
    else if (finalValue > max) {
      finalValue = max;
    }

    setLocalValue(finalValue.toString());
    if (onChange) onChange(finalValue);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="relative">
        <input
          type="number"
          min = {min}
          max = {max}
          step= {step}
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={min.toString()}
          className='w-full pl-4 pr-16 py-2.5 border border-gray-200 rounded-lg outline-none font-mono text-gray-700 focus:border-indigo-500 transition-colors'
        />

        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <span className="text-gray-400 text-sm font-medium bg-white pl-1">
              {suffix}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-end px-1">
        <span className="text-xs text-gray-400 font-medium tracking-wide">
          范围: {min} ~ {max}
        </span>
      </div>
    </div>
  );
};
