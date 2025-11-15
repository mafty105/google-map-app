/**
 * QuickReplies - Quick reply button component
 * Atlassian-inspired design with usability focus
 */

interface QuickRepliesProps {
  replies: string[];
  onReplyClick: (reply: string) => void;
  onSpecialReply?: (reply: string) => void; // Optional handler for special replies like "その他"
}

export default function QuickReplies({ replies, onReplyClick, onSpecialReply }: QuickRepliesProps) {
  if (!replies || replies.length === 0) {
    return null;
  }

  const handleClick = (reply: string) => {
    // Check if this is a special reply that needs custom handling
    if (reply === 'その他' && onSpecialReply) {
      onSpecialReply(reply);
    } else {
      onReplyClick(reply);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {replies.map((reply, index) => (
        <button
          key={index}
          onClick={() => handleClick(reply)}
          className="px-4 py-2 bg-white border-2 border-blue-500 text-blue-700 rounded-full hover:bg-blue-50 transition-colors font-medium text-sm"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
