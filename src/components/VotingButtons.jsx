'use client';

import { useState, useTransition } from 'react';

export default function VotingButtons({
  itemId,
  initialUserVote = null,
  onVote,
  disabled = false,
  className = ''
}) {
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isPending, startTransition] = useTransition();

  const handleVote = async (voteType) => {
    const newVote = userVote === voteType ? null : voteType;
    
    // Optimistic update
    const prevUserVote = userVote;

    // Update local state immediately
    setUserVote(newVote);

    // Call server action
    if (onVote) {
      startTransition(async () => {
        try {
          await onVote(itemId, newVote);
        } catch (error) {
          // Revert optimistic update on error
          setUserVote(prevUserVote);
          console.error('Vote failed:', error);
        }
      });
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Agree Button */}
      <button
        onClick={() => handleVote('up')}
        disabled={disabled || isPending}
        className={`
          flex items-center gap-1 px-3 py-1.5 rounded-md border transition-all
          ${userVote === 'up' 
            ? 'bg-green-100 border-green-500 text-green-700' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }
          ${disabled || isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={userVote === 'up' ? 'Remove agree vote' : 'Agree'}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={userVote === 'up' ? 'fill-current' : ''}
        >
          <path d="M7 10l5-5 5 5H7z"/>
        </svg>
        <span className="text-sm font-medium">
          {userVote === 'up' ? 'Agreed' : 'Agree'}
        </span>
      </button>

      {/* Disagree Button */}
      <button
        onClick={() => handleVote('down')}
        disabled={disabled || isPending}
        className={`
          flex items-center gap-1 px-3 py-1.5 rounded-md border transition-all
          ${userVote === 'down' 
            ? 'bg-red-100 border-red-500 text-red-700' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }
          ${disabled || isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={userVote === 'down' ? 'Remove disagree vote' : 'Disagree'}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={userVote === 'down' ? 'fill-current' : ''}
        >
          <path d="M7 14l5 5 5-5H7z"/>
        </svg>
        <span className="text-sm font-medium">
          {userVote === 'down' ? 'Disagreed' : 'Disagree'}
        </span>
      </button>

      {isPending && (
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
      )}
    </div>
  );
}

// Example Server Action (app/actions/voting.ts)
export async function voteOnItem(itemId, voteType) {
  'use server';
  
  // Your database logic here
  // This would typically:
  // 1. Get current user session
  // 2. Update vote in database
  // 3. Return success or error
  
  console.log(`Voting ${voteType} on item ${itemId}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return success or throw error
  return { success: true };
}

// Usage example in a page/component:
/*
import VotingButtons from '@/components/VotingButtons';
import { voteOnItem } from '@/app/actions/voting';

export default function PostCard({ post }) {
  return (
    <div className="border p-4 rounded-lg">
      <h3>{post.title}</h3>
      <p>{post.content}</p>
      
      <VotingButtons
        itemId={post.id}
        initialUserVote={post.userVote}
        onVote={voteOnItem}
      />
    </div>
  );
}
*/
