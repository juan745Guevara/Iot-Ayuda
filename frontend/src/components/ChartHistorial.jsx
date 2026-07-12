// Gráfico de línea (Chart.js) con historial de aforo y línea de límite

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

export default function ChartHistorial({ labels, data, limite }) {
  if (!labels?.length) {
    return <p style={{ color: 'var(--texto-suave)' }}>Sin datos de historial aún.</p>;
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Personas',
        data,
        borderColor: '#1a7a5e',
        backgroundColor: 'rgba(26, 122, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: labels.length > 14 ? 2 : 4,
        spanGaps: true, // Conectar puntos aunque falten horas sin datos
      },
      {
        label: 'Límite',
        data: labels.map(() => limite),
        borderColor: 'rgba(214, 69, 69, 0.5)',
        borderDash: [6, 4],
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#e8f0ec' }, ticks: { color: '#5c7269', maxTicksLimit: 12 } },
      y: { min: 0, max: limite, grid: { color: '#e8f0ec' }, ticks: { color: '#5c7269' } },
    },
  };

  return (
    <div className="chart-wrap">
      <Line data={chartData} options={options} />
    </div>
  );
}
