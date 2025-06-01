let plot_counter = 0;
let plotTestHandle = null; 
let phChart = null;
 
 //------------------Ph SensorBoard---------------------
 document.addEventListener("DOMContentLoaded", () => {

    phChart = new Chart(document.getElementById('ph_chart').getContext('2d'), config);
    document.getElementById('ph_chart').style.backgroundColor = 'rgb(226, 232, 235)';

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
    label: 'PT1000',
    data: [],
    borderColor: 'rgb(83, 88, 177)',
    tension: 0.2,
    pointRadius: 0,
    hidden: true
    }, 

    {
    label: 'Barometer',
    data: [],
    borderColor: 'rgb(184, 122, 122)',
    tension: 0.2,
    pointRadius: 0,
    hidden: true 
    }, 

    {
    label: 'PH',
    data: [],
    borderColor: 'rgb(200, 196, 88)',
    tension: 0.2,
    pointRadius: 0,
    hidden: true 
    }, 

    {
    label: 'Accelorometer_X',
    data: [],
    borderColor: 'rgb(128, 157, 96)',
    tension: 0.2,
    pointRadius: 0,
    hidden: true 
    }, 

    {
    label: 'Accelorometer_Y',
    data: [],
    borderColor: 'rgb(199, 186, 133)',
    tension: 0.2,
    pointRadius: 0,
    hidden: true
    }, 

    {
    label: 'Accelorometer_Z',
    data: [],
    borderColor: 'rgb(216, 142, 131)',
    tension: 0.2,
    pointRadius: 0,
    hidden: true 
    }, 

    {
    label: 'Magnetfield_X',
    data: [],
    borderColor: 'rgb(81, 132, 208)',
    tension: 0.2,
    pointRadius: 0,
    hidden: true 
    }, 

    {
    label: 'Magnetfield_Y',
    data: [],
    borderColor: 'rgb(36, 103, 57)',
    tension: 0.2,
    pointRadius: 0,
    hidden: true
    }, 

    {
    label: 'Magnetfield_Z',
    data: [],
    borderColor: 'rgb(172, 55, 117)',
    tension: 0.2,
    pointRadius: 0,
    hidden: true
    }
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
        for (let i = 0; i <= 10; i++) {
            data.datasets[i].data.push((i + 1) * simulatedValue);
          }
        phChart.update();
    }, 50);
}

 const stop_Plotting = () => {
    clearInterval(plotTestHandle);
};

const reset_Plotting = () => {
    plot_counter = 0;
    phChart.data.labels = [];

    phChart.data.datasets.forEach(dataset => {
        dataset.data = [];
    });

    phChart.options.scales.x.min = undefined;
    phChart.options.scales.x.max = undefined;
    phChart.options.scales.y.min = undefined;
    phChart.options.scales.y.max = undefined;

    phChart.update();

};
 //------------------End Ph SensorBoard---------------------