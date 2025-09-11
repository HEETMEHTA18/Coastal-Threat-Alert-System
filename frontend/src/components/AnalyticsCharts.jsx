import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  RadialLinearScale,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  RadialLinearScale,
  ArcElement,
);

// Common chart options for consistent styling
const getCommonOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#e2e8f0',
        font: { size: 12 }
      }
    },
    title: {
      display: true,
      text: title,
      color: '#f1f5f9',
      font: { size: 16, weight: 'bold' }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#f1f5f9',
      bodyColor: '#cbd5e1',
      borderColor: '#475569',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.1)' }
    },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.1)' }
    }
  }
});

// Sea Level Trend Chart
export const SeaLevelChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => format(new Date(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Sea Level (m)',
        data: data.map(item => item.level),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: data.map(item => item.predicted ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)'),
        pointRadius: data.map(item => item.predicted ? 6 : 3),
      },
      {
        label: 'Normal Range',
        data: data.map(() => 2.3),
        borderColor: 'rgba(34, 197, 94, 0.5)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      }
    ]
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={getCommonOptions('Sea Level Trends & Predictions')} />
    </div>
  );
};

// Storm Surge Probability Chart
export const StormSurgeChart = ({ data }) => {
  const chartData = {
    labels: data.dates.map(date => format(new Date(date), 'MMM dd')),
    datasets: [
      {
        label: 'Storm Surge Probability',
        data: data.probability.map(p => p * 100),
        backgroundColor: data.probability.map(p => 
          p > 0.3 ? 'rgba(239, 68, 68, 0.8)' : 
          p > 0.2 ? 'rgba(251, 191, 36, 0.8)' : 
          'rgba(34, 197, 94, 0.8)'
        ),
        borderColor: data.probability.map(p => 
          p > 0.3 ? 'rgb(239, 68, 68)' : 
          p > 0.2 ? 'rgb(251, 191, 36)' : 
          'rgb(34, 197, 94)'
        ),
        borderWidth: 2,
      }
    ]
  };

  const options = {
    ...getCommonOptions('7-Day Storm Surge Forecast'),
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      y: {
        ticks: { 
          color: '#94a3b8',
          callback: function(value) { return value + '%'; }
        },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        max: 100
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Coastal Erosion Risk Radar
export const ErosionRiskRadar = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.location),
    datasets: [
      {
        label: 'Erosion Risk Level',
        data: data.map(item => item.risk * 100),
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(239, 68, 68)',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e2e8f0' }
      },
      title: {
        display: true,
        text: 'Coastal Erosion Risk by Region',
        color: '#f1f5f9',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(148, 163, 184, 0.3)' },
        grid: { color: 'rgba(148, 163, 184, 0.3)' },
        pointLabels: { color: '#cbd5e1' },
        ticks: { 
          color: '#94a3b8',
          backdropColor: 'transparent'
        },
        min: 0,
        max: 100
      }
    }
  };

  return (
    <div className="h-64">
      <Radar data={chartData} options={options} />
    </div>
  );
};

// Pollution Sources Distribution
export const PollutionChart = ({ data }) => {
  const totalPollution = data.reduce((sum, item) => sum + item.totalScore, 0);
  
  const chartData = {
    labels: data.map(item => item.location),
    datasets: [
      {
        data: data.map(item => item.totalScore),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Red
          'rgba(251, 191, 36, 0.8)',  // Yellow
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(34, 197, 94, 0.8)',   // Green
          'rgba(147, 51, 234, 0.8)',  // Purple
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(251, 191, 36)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(147, 51, 234)',
        ],
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { 
          color: '#e2e8f0',
          font: { size: 12 }
        }
      },
      title: {
        display: true,
        text: 'Pollution Distribution by Coastal Region',
        color: '#f1f5f9',
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const percentage = ((context.parsed / totalPollution) * 100).toFixed(1);
            return `${context.label}: ${percentage}%`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

// Community Risk Index Chart
export const CommunityRiskChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.zone),
    datasets: [
      {
        label: 'Population (millions)',
        data: data.map(item => item.population),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'Risk Score',
        data: data.map(item => item.riskScore * 100),
        type: 'line',
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 3,
        yAxisID: 'y1',
        tension: 0.4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: { color: '#e2e8f0' }
      },
      title: {
        display: true,
        text: 'Community Risk Assessment',
        color: '#f1f5f9',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: { 
          color: '#94a3b8',
          callback: function(value) { return value + '%'; }
        },
        grid: { drawOnChartArea: false },
        max: 100
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Algal Bloom Risk Chart
export const AlgalBloomChart = ({ data }) => {
  const chartData = {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [
      {
        label: 'Bloom Risk Index',
        data: data.riskIndex.map(r => r * 100),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Water Temperature (°C)',
        data: data.waterTemp,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
      },
      {
        label: 'Chlorophyll (mg/m³)',
        data: data.chlorophyll,
        borderColor: 'rgb(251, 191, 36)',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        fill: false,
        tension: 0.4,
        yAxisID: 'y2',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: { color: '#e2e8f0', font: { size: 11 } }
      },
      title: {
        display: true,
        text: 'Algal Bloom Risk Analysis',
        color: '#f1f5f9',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: { 
          color: '#94a3b8',
          callback: function(value) { return value + '%'; }
        },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        max: 100
      },
      y1: {
        type: 'linear',
        display: false,
        position: 'right',
        grid: { drawOnChartArea: false },
      },
      y2: {
        type: 'linear',
        display: false,
        position: 'right',
        grid: { drawOnChartArea: false },
      }
    }
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};
