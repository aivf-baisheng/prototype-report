import VotingButtonsShadcn from '@/components/VotingButtonsShadcn';

export default function TestShadcnVoting() {
  const handleVote = async (itemId, voteType) => {
    console.log(`Voting ${voteType} on item ${itemId}`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Vote processed successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Shadcn/UI Voting Buttons Demo
        </h1>
        
        <div className="space-y-8">
          {/* Example 1: No initial vote */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Example 1: No Initial Vote
            </h2>
            <p className="text-gray-600 mb-4">
              This shows the default state of the voting buttons.
            </p>
            <VotingButtonsShadcn
              itemId="example-1"
              onVote={handleVote}
            />
          </div>

          {/* Example 2: With initial agree vote */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Example 2: Initial Agree Vote
            </h2>
            <p className="text-gray-600 mb-4">
              This shows the buttons when the user has already agreed.
            </p>
            <VotingButtonsShadcn
              itemId="example-2"
              initialUserVote="up"
              onVote={handleVote}
            />
          </div>

          {/* Example 3: With initial disagree vote */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Example 3: Initial Disagree Vote
            </h2>
            <p className="text-gray-600 mb-4">
              This shows the buttons when the user has already disagreed.
            </p>
            <VotingButtonsShadcn
              itemId="example-3"
              initialUserVote="down"
              onVote={handleVote}
            />
          </div>

          {/* Example 4: Disabled state */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Example 4: Disabled State
            </h2>
            <p className="text-gray-600 mb-4">
              This shows the buttons in a disabled state.
            </p>
            <VotingButtonsShadcn
              itemId="example-4"
              onVote={handleVote}
              disabled={true}
            />
          </div>
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Key Features:
          </h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Uses shadcn/ui Button components for consistent styling</li>
            <li>• Disagree button shows img_disagree.png when not selected</li>
            <li>• Smooth transitions and hover effects</li>
            <li>• Responsive design with proper spacing</li>
            <li>• Accessible with proper ARIA labels</li>
            <li>• Optimistic updates for better UX</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
