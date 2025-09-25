interface ChatHeaderProps {
  title: string;
  subtitle?: string;
}

export function ChatHeader({ title, subtitle }: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {subtitle && (
        <p className="text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}