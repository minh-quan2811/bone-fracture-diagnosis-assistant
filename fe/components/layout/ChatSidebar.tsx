import { User, ConversationBase } from "@/types";
import { ConversationList } from "../chat/ConversationList";

interface ChatSidebarProps {
  user: User | null;
  conversations: ConversationBase[];
  activeConversationId: number | null;
  onNewChat: () => Promise<void>;
  onSelectConversation: (conversation: ConversationBase) => Promise<void>;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export function ChatSidebar({
  user,
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onLogout,
  onToggleSidebar,
}: ChatSidebarProps) {
  const getInitials = (username: string) => {
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return username.slice(0, 1).toUpperCase();
  };

  const roleLabel = user?.role === "student" ? "Student" : user?.role === "teacher" ? "Teacher" : "";

  return (
    <div className="w-[260px] bg-white flex flex-col h-full border-r border-gray-100 sidebar-font">
      {/* ── Header: user profile + collapse toggle ── */}
      <div className="flex-shrink-0 px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          {/* Avatar with initials */}
          <div className="w-9 h-9 rounded-full bg-[#2E7D5C] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold tracking-wide">
              {user ? getInitials(user.username) : "—"}
            </span>
          </div>

          {/* Name + role */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
              {user?.username || "Guest"}
            </p>
            {roleLabel && (
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#2E7D5C] bg-[#EDF7F1] px-1.5 py-0.5 rounded-md mt-0.5 leading-none">
                {roleLabel}
              </span>
            )}
          </div>

          {/* Collapse button — shows < to close */}
          <button
            onClick={onToggleSidebar}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150 flex-shrink-0"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* New Chat button */}
        <button
          onClick={onNewChat}
          className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2E7D5C] hover:bg-[#1B5E3A] active:bg-[#1B5E3A] transition-colors duration-150 tracking-tight"
        >
          + New Chat
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 h-px bg-gray-100" />

      {/* ── History label ── */}
      <div className="px-5 pt-4 pb-2 flex-shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Conversations
        </p>
      </div>

      {/* ── Scrollable conversation list ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={onSelectConversation}
        />
      </div>

      {/* ── Sign Out ── */}
      <div className="flex-shrink-0 px-3 py-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full px- py-2 text-sm font-semibold text-gray-500 rounded-lg border border-gray-400 bg-white hover:border-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-150"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}