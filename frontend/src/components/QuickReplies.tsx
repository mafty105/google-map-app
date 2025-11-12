/**
 * QuickReplies - Quick reply button component
 * Based on IKYU Design Guideline
 */

interface QuickRepliesProps {
  replies: string[];
  onReplyClick: (reply: string) => void;
}

export default function QuickReplies({ replies, onReplyClick }: QuickRepliesProps) {
  if (!replies || replies.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {replies.map((reply, index) => (
        <button
          key={index}
          onClick={() => onReplyClick(reply)}
          className="
            px-4 py-2
            bg-white
            border border-[--color-gray-200]
            rounded-[20px]
            text-sm text-[--color-gray-800]
            transition-all duration-200
            hover:bg-[--color-light-blue] hover:border-[--color-light-blue] hover:text-white
            active:scale-95
          "
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
