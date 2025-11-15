/**
 * QuickReplies - Quick reply button component
 * Atlassian-inspired design with usability focus
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
          className="px-4 py-2 bg-white border-2 border-blue-500 text-blue-700 rounded-full hover:bg-blue-50 transition-colors font-medium text-sm"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
