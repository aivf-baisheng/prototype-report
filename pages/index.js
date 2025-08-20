import { useState } from 'react'
import TestReport from '../src/TestReport'
import ConfirmBenchmarkTest from '../src/ConfirmBenchmarkTest'
import TestChart from '../src/TestChart'
import Head from 'next/head'

export default function Home() {
  const [currentView, setCurrentView] = useState('test-report')

  const renderCurrentView = () => {
    switch (currentView) {
      case 'test-report':
        return <TestReport />
      case 'confirm-benchmark-test':
        return <ConfirmBenchmarkTest />
      case 'test-chart':
        return <TestChart />
      default:
        return <TestReport />
    }
  }

  return (
    <>
      <Head>
        <title>Prototype Report App</title>
        <meta name="description" content="Prototype report application with React frontend and Python backend" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="app-container">
        <nav style={{ padding: '20px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
          <button 
            onClick={() => setCurrentView('test-report')}
            style={{ 
              marginRight: '10px', 
              padding: '8px 16px', 
              backgroundColor: currentView === 'test-report' ? '#3B82F6' : '#e5e7eb',
              color: currentView === 'test-report' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Report
          </button>
          <button 
            onClick={() => setCurrentView('confirm-benchmark-test')}
            style={{ 
              marginRight: '10px', 
              padding: '8px 16px', 
              backgroundColor: currentView === 'confirm-benchmark-test' ? '#3B82F6' : '#e5e7eb',
              color: currentView === 'confirm-benchmark-test' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Confirm Benchmark
          </button>
          <button 
            onClick={() => setCurrentView('test-chart')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: currentView === 'test-chart' ? '#3B82F6' : '#e5e7eb',
              color: currentView === 'test-chart' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Chart
          </button>
        </nav>
        <main className="main-content">
          {renderCurrentView()}
        </main>
      </div>
    </>
  )
}
