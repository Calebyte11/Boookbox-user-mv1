/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Heart, MessageCircle, Send, User } from "lucide-react";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEO from "@/components/SEO";
import { useTicketInteractions } from "@/hooks/useTicketServices";
// import { useToast } from "@/hooks/useToast";
import type { ApiTicketResponse } from "@/types/ticket";

const EngagementPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  //   const { toast } = useToast();

  // Get ticket data from navigation state
  const ticketFromState = location.state?.ticketData as
    | ApiTicketResponse
    | undefined;
  const bookingIdFromState = location.state?.bookingId as string | undefined;

  // State for new message
  const [newMessage, setNewMessage] = useState("");

  // Get full engagement data
  const {
    messages,
    engagements,
    isLoadingMessages,
    isLoadingEngagements,
    isPostingMessage,
    isPostingReaction,
    postMessage,
    postReaction,
    messageError,
    reactionError,
  } = useTicketInteractions(ticketId || "", bookingIdFromState);

  // Get current ticket's engagement data
  const currentTicketEngagement = engagements.find(
    (eng: { ticketId: string | undefined }) => eng.ticketId === ticketId
  );

  const handleBack = () => {
    navigate(-1);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !ticketId) return;
    postMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleReaction = (reaction: string) => {
    if (!ticketId) return;
    postReaction(reaction as any);
  };

  const isLoading = isLoadingMessages || isLoadingEngagements;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex mx-4 items-center my-4">
          <Button
            className="p-2 bg-[#ECE6F0] rounded-lg w-[48px] h-[48px]"
            onClick={handleBack}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <p className="text-center text-2xl justify-center w-full p-2">
            Engagement
          </p>
        </div>
        <div className="flex justify-center items-center flex-1">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const userReaction = currentTicketEngagement?.userReaction;

  return (
    <>
      <SEO
        title="Ticket Engagement"
        description="View all engagement for this ticket"
      />

      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex mx-4 items-center py-4">
            <Button
              className="p-2 bg-[#ECE6F0] rounded-lg w-[48px] h-[48px]"
              onClick={handleBack}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-semibold">Engagement</h1>
              <p className="text-sm text-gray-600">
                Ticket: {ticketFromState?.ticketId || ticketId}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-6">
          {/* Reactions Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold">Reactions</h2>
            </div>

            {/* Reaction Stats */}
            {currentTicketEngagement && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-5 gap-2 text-center">
                  {currentTicketEngagement.reactions.map(
                    (reaction: { type: string; count: number }) => (
                      <div
                        key={reaction.type}
                        className="flex flex-col items-center"
                      >
                        <span className="text-lg mb-1">
                          {reaction.type === "like" && "👍"}
                          {reaction.type === "love" && "❤️"}
                          {reaction.type === "wow" && "😮"}
                          {reaction.type === "sad" && "😢"}
                          {reaction.type === "angry" && "😠"}
                        </span>
                        <span className="text-sm font-medium">
                          {reaction.count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Reaction Buttons */}
            <div className="flex justify-around gap-2">
              {(["like", "love", "wow", "sad", "angry"] as const).map(
                (reaction) => {
                  const hasUserReacted = userReaction === reaction;

                  return (
                    <Button
                      key={reaction}
                      onClick={() => handleReaction(reaction)}
                      disabled={isPostingReaction}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                        hasUserReacted
                          ? "bg-orange-200 text-orange-700 border-orange-300 scale-110"
                          : "bg-gray-50 hover:bg-orange-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      <span className="text-lg">
                        {reaction === "like" && "👍"}
                        {reaction === "love" && "❤️"}
                        {reaction === "wow" && "😮"}
                        {reaction === "sad" && "😢"}
                        {reaction === "angry" && "😠"}
                      </span>
                      <span className="text-xs">
                        {reaction.charAt(0).toUpperCase() + reaction.slice(1)}
                      </span>
                    </Button>
                  );
                }
              )}
            </div>

            {reactionError && (
              <p className="text-red-500 text-sm mt-2">
                {reactionError.message}
              </p>
            )}
          </div>

          {/* Messages Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Messages</h2>
              <span className="text-sm text-gray-500">
                ({messages.length}{" "}
                {messages.length === 1 ? "message" : "messages"})
              </span>
            </div>

            {/* Messages List */}
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((message: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {/* {message?.user?.fullName || "Anonymous User"} */}
                            Anonymous User
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No messages yet. Be the first to leave a message!</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write a message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isPostingMessage}
                  className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isPostingMessage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {messageError && (
                <p className="text-red-500 text-sm mt-2">
                  {messageError.message}
                </p>
              )}
            </div>
          </div>

          {/* Engagement Summary */}
          {currentTicketEngagement && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Engagement Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {currentTicketEngagement.commentsCount}
                  </div>
                  <div className="text-sm text-blue-600">Comments</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {currentTicketEngagement.reactions.reduce(
                      (sum: any, r: { count: any }) => sum + r.count,
                      0
                    )}
                  </div>
                  <div className="text-sm text-red-600">Reactions</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EngagementPage;
