import TestChart from '@/TestChart'
import Head from 'next/head'

export default function TestChartPage() {
  return (
    <>
      <Head>
        <title>Test Chart - Chart.js Horizontal Bar Chart</title>
        <meta name="description" content="Horizontal bar chart example using react-chartjs-2" />
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
        maxWidth: '1200px', 
        margin: '0 auto', 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <TestChart />
      </div>
    </>
  )
}
