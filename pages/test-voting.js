import VotingButtons from '../src/components/VotingButtons'
import Head from 'next/head'

export default function TestVotingPage() {
  const handleVote = async (itemId, voteType) => {
    console.log(`Voting ${voteType} on item ${itemId}`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Vote recorded successfully');
  };

  return (
    <>
      <Head>
        <title>Test Voting Buttons</title>
        <meta name="description" content="Test page for VotingButtons component" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style jsx global>{`
          body {
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        `}</style>
      </Head>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '30px', color: '#333' }}>Voting Buttons Test</h1>
        
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '20px', color: '#555' }}>Default State</h3>
          <VotingButtons
            itemId="test-1"
            onVote={handleVote}
          />
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '20px', color: '#555' }}>With Initial Agree Vote</h3>
          <VotingButtons
            itemId="test-2"
            initialUserVote="up"
            onVote={handleVote}
          />
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '20px', color: '#555' }}>With Initial Disagree Vote</h3>
          <VotingButtons
            itemId="test-3"
            initialUserVote="down"
            onVote={handleVote}
          />
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '20px', color: '#555' }}>Disabled State</h3>
          <VotingButtons
            itemId="test-4"
            onVote={handleVote}
            disabled={true}
          />
        </div>
      </div>
    </>
  )
}
