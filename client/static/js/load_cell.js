let plotCounter = 0;
let loadCellChart = null;
 
 document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("start_plotting").addEventListener("click", () => {
        window.sendPlotState(window.activeBoard, "Weight", "Start");
        window.lcPlotStatus = true;
    });

    document.getElementById("stop_plotting").addEventListener("click", () => {
        window.sendPlotState(window.activeBoard, "Weight", "Stop");
        window.lcPlotStatus = false;
    });

    document.getElementById("reset_plotting").addEventListener("click", () => {
        resetPlotting();
        window.sendPlotState(window.activeBoard, "Weight", "Reset");
        window.lcPlotStatus = false;
    });

    document.getElementById("tare_button").addEventListener("click", () => {
        window.sendVariableUpdate(window.activeBoard, "Tare", 1);
    });

    document.getElementById("calibrate_button").addEventListener("click", () => {
        const gradient = document.getElementById("gradient_value").value;
        const offset = document.getElementById("offset_value").value;
        window.sendVariableUpdate(window.activeBoard, "Offset", offset);
        window.sendVariableUpdate(window.activeBoard, "Gradient", gradient);
    });
});

// Resets the Chart
const resetPlotting = () => {
    plotCounter = 0;
    loadCellChart.data.labels = [];

    loadCellChart.data.datasets.forEach(dataset => {
        dataset.data = [];
    });

    loadCellChart.options.scales.x.min = undefined;
    loadCellChart.options.scales.x.max = undefined;
    loadCellChart.options.scales.y.min = undefined;
    loadCellChart.options.scales.y.max = undefined;
    loadCellChart.update();
};

//Define the data displayed in the plot
const data = {
    labels: [],
    datasets: [{
        label: 'Weight',
        data: [],
        borderColor: 'rgb(83, 88, 177)',
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
