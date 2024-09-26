import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SystemUsageChart = ({ cpuUsage, ramUsage, swapUsage }) => {
    // Gráfico de uso de CPU total
    const cpuData = {
        labels: ['CPU Total'],
        datasets: [
            {
                label: 'Uso de CPU (%)',
                data: [Number(cpuUsage)],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Gráfico de uso de RAM separado
    const ramData = {
        labels: ['RAM'],
        datasets: [
            {
                label: 'Uso de RAM (%)',
                data: [Number(ramUsage).toFixed(2)],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Gráfico de uso de Swap separado
    const swapData = {
        labels: ['Swap'],
        datasets: [
            {
                label: 'Uso de Swap (%)',
                data: [Number(swapUsage).toFixed(2)],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Opções para os gráficos de CPU, RAM e Swap
    const options = {
        maintainAspectRatio: false, // Permite o gráfico ocupar mais espaço verticalmente
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    stepSize: 10, // Define intervalos de 10 unidades para uma visualização melhor
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
        },
    };

    return (
        <div className='flex justify-between'>
            {/* Gráfico de CPU Total */}
            <div>
                <h2>Gráfico de Uso de CPU Total</h2>
                <div style={{ maxWidth: '150px', height: '250px', marginBottom: '20px' }}>
                    <Bar data={cpuData} options={options} />
                </div>
            </div>

            {/* Gráfico de RAM separado */}
            <div>
                <h2>Gráfico de Uso de RAM</h2>
                <div style={{ maxWidth: '150px', height: '250px', marginBottom: '20px' }}>
                    <Bar data={ramData} options={options} />
                </div>
            </div>

            {/* Gráfico de Uso de Swap separado */}
            <div>
                <h2>Gráfico de Uso de Swap</h2>
                <div style={{ maxWidth: '150px', height: '250px', marginBottom: '20px' }}>
                    <Bar data={swapData} options={options} />
                </div>
            </div>
        </div>
    );
};

export default SystemUsageChart;
