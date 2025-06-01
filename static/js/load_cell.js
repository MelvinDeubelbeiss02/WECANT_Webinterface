let plot_counter = 0;
let plotTestHandle = null; 
let loadCellChart = null;
 
 //------------------LoadCell SensorBoard---------------------
 document.addEventListener("DOMContentLoaded", () => {
    //loadCellChart = new Chart(document.getElementById('load_cell_chart').getContext('2d'), config);
    //document.getElementById('load_cell_chart').style.backgroundColor = 'rgb(226, 232, 235)';


    document.getElementById("start_plotting").addEventListener("click", () => {
    console.log("start_plotting");
    plotTestHandle = start_Plotting();
    });

    document.getElementById("stop_plotting").addEventListener("click", () => {
    console.log("stop_plotting");
    stop_Plotting();
    });

    document.getElementById("reset_plotting").addEventListener("click", () => {
    console.log("reset_plotting");
    reset_Plotting();
    });

    document.getElementById("tare_button").addEventListener("click", () => {
      console.log("tare");
      window.sendVariableUpdate(window.active_board, "Tare", 1);
    });

    document.getElementById("calibrate_button").addEventListener("click", () => {
      console.log("tare");
      const gradient = document.getElementById("gradient_value").value;
      const offset = document.getElementById("offset_value").value;
      
      window.sendVariableUpdate(window.active_board, "Offset", offset);
      window.sendVariableUpdate(window.active_board, "Gradient", gradient);
    });
});


 const data = {
   labels: [],
   datasets: [{
     label: 'Humidity',
     data: [],
     borderColor: 'rgb(75, 192, 192)',
     tension: 0.2,
     pointRadius: 0,
     hidden: true
   },

   {
   label: 'SHT35',
   data: [],
   borderColor: 'rgb(198, 118, 185)',
   tension: 0.2,
   pointRadius: 0,
   hidden: true 
   }, 

   {
    label: 'Load',
    data: [],
    borderColor: 'rgb(83, 88, 177)',
    tension: 0.2,
    pointRadius: 0,
    hidden: true
    }, 

    ]
 };
 
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
 
 
 const start_Plotting = () =>  {
    return setInterval(() => {
        const simulatedValue = 50 + Math.random() * 10; 
        data.labels.push(plot_counter++);
        for (let i = 0; i <= 2; i++) {
            data.datasets[i].data.push((i + 1) * simulatedValue);
          }
          loadCellChart.update();
    }, 50);
}

 const stop_Plotting = () => {
    clearInterval(plotTestHandle);
};

const reset_Plotting = () => {
    plot_counter = 0;
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
 //------------------End LoadCell SensorBoard---------------------