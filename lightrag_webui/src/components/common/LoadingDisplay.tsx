interface LoadingDisplayProps {
  icon?: React.ReactNode;
  content: string;
}

export const LoadingDisplay = ({
  icon,
  content
}: LoadingDisplayProps) => {
  return (
    <div className="h-full min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="inline-block animate-spin text-indigo-600 mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {content}
        </h3>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full animate-progress-indeterminate" />
        </div>
      </div>
    </div>
  );
};
