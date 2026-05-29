export default function ChatPage() {
  return (
    <div className="flex h-full">
      <div className="w-[280px] bg-white border-r border-wechat-divider" />
      <div className="flex-1 flex items-center justify-center bg-wechat-bg">
        <p className="text-wechat-text-gray text-body">选择一位联系人开始对话</p>
      </div>
    </div>
  );
}
