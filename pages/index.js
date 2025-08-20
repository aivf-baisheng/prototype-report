import { useState } from 'react'
import TestReport from '../src/TestReport'
import ConfirmBenchmarkTest from '../src/ConfirmBenchmarkTest'
import Head from 'next/head'

export default function Home() {
  const [currentView, setCurrentView] = useState('test-report')

  const renderCurrentView = () => {
    switch (currentView) {
      case 'test-report':
        return <TestReport />
      case 'confirm-benchmark-test':
        return <ConfirmBenchmarkTest />
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
        <main className="main-content">
          {renderCurrentView()}
        </main>
      </div>
    </>
  )
}
