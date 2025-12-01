interface SettingCardProps {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  children: React.ReactNode;
  valueLabel?: string | number;
  statusLabel?: string;
  statusColor?: string;
};

export const SettingCard = ({
  icon: Icon,
  title,
  description,
  children,
  valueLabel,
  statusLabel,
  statusColor = 'bg-gray-100 text-gray-600',
}: SettingCardProps ) => (
  <div className="bg-white p-6 rounded-xl border-[0.5px] border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="flex items-start gap-4 mb-4">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            {statusLabel && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}
              >
                {statusLabel}
              </span>
            )}
            {valueLabel !== undefined && (
              <span className="text-sm font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border-[0.5px] border-gray-200">
                {valueLabel}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </div>
    <div className="pl-[52px]">{children}</div>
  </div>
);
