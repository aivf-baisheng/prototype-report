'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export default function VotingButtonsShadcn({
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
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Agree Button */}
      {userVote === 'up' ? (
        <Button
          onClick={() => handleVote('up')}
          disabled={disabled || isPending}
          variant="ghost"
          size="icon"
          className="p-0 h-auto w-auto hover:bg-transparent transition-all duration-200"
          aria-label="Remove agree vote"
        >
          <img 
            src="/VerdictAgree.png" 
            alt="Remove agree vote" 
            className="object-contain hover:opacity-80 transition-opacity duration-200"
          />
        </Button>
      ) : (
        <Button
          onClick={() => handleVote('up')}
          disabled={disabled || isPending}
          variant="ghost"
          size="icon"
          className="p-0 h-auto w-auto hover:bg-transparent transition-all duration-200"
          aria-label="Agree"
        >
          <img 
            src="/defaultagree.png" 
            alt="Agree" 
            className="object-contain hover:opacity-80 transition-opacity duration-200"
          />
        </Button>
      )}

      {/* Disagree Button */}
      {userVote === 'down' ? (
        <Button
          onClick={() => handleVote('down')}
          disabled={disabled || isPending}
          variant="ghost"
          size="icon"
          className="p-0 h-auto w-auto hover:bg-transparent transition-all duration-200"
          aria-label="Remove disagree vote"
        >
          <img 
            src="/VerdictDisagree.png" 
            alt="Remove disagree vote" 
            className="object-contain hover:opacity-80 transition-opacity duration-200"
          />
        </Button>
      ) : (
        <Button
          onClick={() => handleVote('down')}
          disabled={disabled || isPending}
          variant="ghost"
          size="icon"
          className="p-0 h-auto w-auto hover:bg-transparent transition-all duration-200"
          aria-label="Disagree"
        >
          <img 
            src="/defaultdisagree.png" 
            alt="Disagree" 
            className="object-contain hover:opacity-80 transition-opacity duration-200"
          />
        </Button>
      )}

      {/* Loading Spinner */}
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
import VotingButtonsShadcn from '@/components/VotingButtonsShadcn';
import { voteOnItem } from '@/components/VotingButtonsShadcn';

export default function PostCard({ post }) {
  return (
    <div className="border p-4 rounded-lg">
      <h3>{post.title}</h3>
      <p>{post.content}</p>
      
      <VotingButtonsShadcn
        itemId={post.id}
        initialUserVote={post.userVote}
        onVote={voteOnItem}
      />
    </div>
  );
}
*/
