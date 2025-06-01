let plotCounter = 0;
let phSensorChart = null;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("start_plotting").addEventListener("click", () => {
        window.sendPlotState(window.activeBoard, "temp_sht", "Start");
        window.phPlotStatus = true;
    });

    document.getElementById("stop_plotting").addEventListener("click", () => {
        window.sendPlotState(window.activeBoard, "temp_sht", "Stop");
        window.phPlotStatus = false;
    });

    document.getElementById("reset_plotting").addEventListener("click", () => {
        resetPlotting();
        window.sendPlotState(window.activeBoard, "temp_sht", "Reset");
        window.phPlotStatus = false;
    });
});

// Resets the Chart
const resetPlotting = () => {
    plotCounter = 0;
    phSensorChart.data.labels = [];
    phSensorChart.data.datasets.forEach(dataset => {
        dataset.data = [];
    });

    phSensorChart.options.scales.x.min = undefined;
    phSensorChart.options.scales.x.max = undefined;
    phSensorChart.options.scales.y.min = undefined;
    phSensorChart.options.scales.y.max = undefined;
    phSensorChart.update();
};

//Define the data displayed in the plot
const data = {
    labels: [],
    datasets: [{
        label: 'temp_sht',
        data: [],
        borderColor: 'rgb(198, 118, 185)',
        tension: 0.2,
        pointRadius: 0,
        hidden: false 
        }, 
    ]
 };
 
 //Configuration for the chart
 const config = {
    type: 'line',
    data: data,
    options: {
        animation: false,
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: 'black' 
                }
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                },
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: 'x',
                }
            }, 
            tooltip: {
            enabled: true, 
            mode: 'nearest', 
            intersect: false, 
            position: 'nearest', 
            callbacks: {
                label: function(tooltipItem) {
                    return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`; 
                }
            }
            }

        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Messwert',
                    color: 'black'
                },
                ticks: {
                    color: 'black'
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Sensorwert',
                    color: 'black'
                },
                ticks: {
                    color: 'black' 
                },
            }
        }
    }
};