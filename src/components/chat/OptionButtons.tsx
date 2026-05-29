import { useAppStore } from '../../store/appStore';

interface Props {
  options: string[];
  messageId: string;
}

export default function OptionButtons({ options, messageId }: Props) {
  const sendMessage = useAppStore(s => s.sendMessage);
  const isStreaming = useAppStore(s => s.isStreaming);

  const handleClick = async (option: string) => {
    if (isStreaming) return;
    await sendMessage(option);
  };

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {options.map((opt, i) => (
        <button
          key={i}
          id={`option-btn-${messageId}-${i}`}
          onClick={() => handleClick(opt)}
          disabled={isStreaming}
          className="option-btn group relative"
        >
          <span>{opt}</span>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-wechat-green text-small">
            ↵
          </span>
        </button>
      ))}
    </div>
  );
}
