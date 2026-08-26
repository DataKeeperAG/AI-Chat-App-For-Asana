type ClearChatButtonProps = {
  onClear: () => void;
  disabled?: boolean;
};

export default function ClearChatButton({
  onClear,
  disabled = false,
}: Readonly<ClearChatButtonProps>) {
  return (
    <button
      type="button"
      onClick={onClear}
      disabled={disabled}
      className="text-sm text-gray-500 hover:text-black disabled:opacity-40"
    >
      Clear chat
    </button>
  );
}