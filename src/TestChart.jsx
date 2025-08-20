import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TestChart = () => {
  // Sample data for the horizontal bar chart
  const data = [
    { name: 'MMLU', percentage: 72.5 },
    { name: 'Facts about Singapore', percentage: 90 },
    { name: 'Content Safety', percentage: 85 },
    { name: 'Bias Detection', percentage: 95 }
  ];

  // Chart.js configuration for horizontal bar chart
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: 'Percentage Score',
        data: data.map(item => item.percentage),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(16, 185, 129, 0.8)',   // Green
          'rgba(245, 158, 11, 0.8)',   // Yellow
          'rgba(239, 68, 68, 0.8)',    // Red
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Chart options for horizontal layout
  const options = {
    indexAxis: 'y', // This makes the chart horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#333',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: 'Benchmark Test Results',
        color: '#333',
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.x}%`;
          }
        }
      }
    },
    scales: {
      x: {
        // Horizontal axis (percentage values)
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          },
          callback: function(value) {
            return value + '%';
          }
        },
        title: {
          display: true,
          text: 'Percentage Score',
          color: '#333',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      y: {
        // Vertical axis (test names)
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#333',
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    },
    elements: {
      bar: {
        barThickness: 12, // Fixed bar thickness - made thinner
        maxBarThickness: 12, // Maximum bar thickness
      }
    },
    datasets: {
      bar: {
        categoryPercentage: 0.3, // Controls space between categories
        barPercentage: 0.6, // Controls bar width within category space
      }
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'white',
      color: '#333',
      padding: '30px',
      maxWidth: '900px',
      margin: '0 auto',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ 
        color: '#333', 
        marginBottom: '20px', 
        textAlign: 'center',
        fontSize: '28px',
        fontWeight: 'bold'
      }}>
        📊 Benchmark Test Results
      </h2>
      
      <p style={{ 
        color: '#666', 
        marginBottom: '30px', 
        textAlign: 'center',
        fontSize: '16px',
        lineHeight: '1.6'
      }}>
        Horizontal bar chart showing performance across different test categories
      </p>
      
      {/* Chart Container */}
      <div style={{ 
        height: '500px', 
        marginBottom: '30px',
        border: '2px solid #f0f0f0',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        padding: '20px'
      }}>
        <Bar data={chartData} options={options} />
      </div>

      {/* Data Summary */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ color: '#333', marginTop: '0', marginBottom: '15px' }}>
          📈 Performance Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {data.map((item, index) => (
            <div key={index} style={{ 
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: chartData.datasets[0].backgroundColor[index].replace('0.8', '1'),
                marginBottom: '5px'
              }}>
                {item.percentage}%
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666',
                fontWeight: '500'
              }}>
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Data */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#e8f4fd', 
        borderRadius: '8px',
        border: '1px solid #cce7ff'
      }}>
        <h3 style={{ color: '#333', marginTop: '0', marginBottom: '15px' }}>
          🔍 Raw Data
        </h3>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '6px', 
          overflow: 'auto',
          border: '1px solid #e0e0e0',
          color: '#333',
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
{JSON.stringify(data, null, 2)}
        </pre>
      </div>

      {/* Chart Info */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <h3 style={{ color: '#333', marginTop: '0', marginBottom: '15px' }}>
          ℹ️ Chart Information
        </h3>
        <ul style={{ color: '#333', lineHeight: '1.6', margin: '0', paddingLeft: '20px' }}>
          <li><strong>Library:</strong> react-chartjs-2 with Chart.js</li>
          <li><strong>Chart Type:</strong> Horizontal Bar Chart</li>
          <li><strong>Data Source:</strong> Benchmark test results</li>
          <li><strong>Responsive:</strong> Yes, adapts to container size</li>
          <li><strong>Interactive:</strong> Hover tooltips and legends</li>
        </ul>
      </div>
    </div>
  );
};

export default TestChart;
