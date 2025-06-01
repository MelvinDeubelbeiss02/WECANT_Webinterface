const socket = io();
window.socket = socket;
window.active_board = null;
window.boards = []



document.addEventListener("DOMContentLoaded", () => {
    window.active_board = sessionStorage.getItem("active_board");
    if (active_board) {
      document.getElementById("sensorname").innerText = active_board;
    }
});

updateSensorList = () => {
  const sensorList = document.getElementById("sensor-list");

  const existingIds = new Set(
      Array.from(sensorList.querySelectorAll("li")).map(li => li.dataset.id)
  );
  window.boards.forEach(board => {
      if (!existingIds.has(String(board.id))) {
          let listItem = document.createElement("li");
          listItem.dataset.id = board.id;

          let link = document.createElement("a");
          link.href = `/board/${board.id}?template=${board.template}`;
          link.textContent = board.name;

          listItem.appendChild(link);
          sensorList.appendChild(listItem);

          link.addEventListener("click", (e) => {
              sessionStorage.setItem("active_board", board.name);
              window.active_board = board.name;
              document.getElementById("sensorname").innerText = board.name;
              console.log("Link geswitched");
          });
      }
  });
};

window.sendVariableUpdate = (boardname, variable, value) => {
    const msg = {
        Boardname: boardname,
        Variablename: variable,
        Value: value
    };
    console.log("Sending message", msg);
    window.socket.send(JSON.stringify(msg)); // Ensures it's JSON
}

const updateBoardValue = (boardName, variableName, value) => {
    const board = boards.find(b => b.name === boardName);
    if (board) {
      board[variableName] = value;
    } else {
      console.warn(`Board "${boardName}" nicht gefunden.`);
    }
}

window.socket.on('NewBoard', (data) => {
    console.log("Received NewBoard:", data);
    addNewBoard(data);
    //window.updateSensorList();
});

window.socket.on('NewValue', (data) => {
    //console.log("Received NewValue:", data);
    updateValue(data);
});

window.socket.on('connect', () => {
    console.log('Connected to server');
});


const addNewBoard = (data) =>  {
    const boardName = data.Name;
    const template = boardName.startsWith("Beacon") ? "beacon.html"
                    : boardName.startsWith("pH-Board") ? "ph_sensorboard.html"
                    : boardName.startsWith("LC") ? "load_cell.html"
                    : "generic.html";

    let board = window.boards.find(b => b.name === boardName);
  
    if (!board) {
      board = {
        id: window.boards.length + 1,
        name: boardName,
        template
      };
      window.boards.push(board);
    }
  
    data.Variables.forEach(v => {
      board[v.Name] = v.Value;
    });

    updateSensorList();

    if (window.active_board == boardName){
      if (boardName.startsWith("LC")){
        const board = window.boards.find(b => b.name === window.active_board);


        loadCellChart = new Chart(document.getElementById('load_cell_chart').getContext('2d'), config);
        //document.getElementById('load_cell_chart').style.backgroundColor = 'rgb(226, 232, 235)';

        if (board){
          document.getElementById("gradient_value").value = board.Gradient;
          document.getElementById("offset_value").value = board.Offset;
  
          for (let key in board) {
            const text_id = document.getElementById(`LC_${key}`);
            if (text_id){
              console.log("Update LC")
              text_id.innerText = parseFloat(board[key]).toFixed(2);
            }
          }
        }
      } else if (boardName.startsWith("pH-Board")){
        const board = window.boards.find(b => b.name === window.active_board);
        if (board){
          for (let key in board) {
            const text_id = document.getElementById(`pH-Board_${key}`);
            if (text_id){
              console.log("Update phBoard")
              text_id.innerText = parseFloat(board[key]).toFixed(2);
              
            }
          }
        }
      } else if (boardName.startsWith("Beacon")){
        console.log("here");
        window.initBeaconPage();
      } else {
        console.log("generic")
        data.Variables.forEach(v => {
          if (v.Permission == "eRead"){
            addReadContainer(boardName, v.Name, parseFloat(v.Value).toFixed(2), v.Unit);
          } else if ((v.Permission == "eReadWrite")){
            addReadWriteContainer(boardName, v.Name, parseFloat(v.Value).toFixed(2), v.Unit);
            document.getElementById(`${boardName}_${v.Name}_value`).addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                  e.preventDefault(); 
                  window.sendVariableUpdate(window.active_board, v.Name, document.getElementById(`${boardName}_${v.Name}_value`).value);
              }
          });
          }
        });
      }
    }
}

function addReadWriteContainer(boardName, varName, value, unit) {
  const container = document.createElement("div");
  container.className = "control_container";
  if (unit == " "){
    container.innerHTML = `
    <div class="var_ctrl_container">
        <div class="var_paragraph">
            <p>${varName}:</p>
        </div>
        <div class="edit_var">
            <input id="${boardName}_${varName}_value" type="text" name="{varName}_value" value = ${value}><br>
        </div>
    </div>
`;
  } else {
    const htmlVarHeader = `<p>${varName} (${unit})</p>`;
    container.innerHTML = `
    <div class="var_ctrl_container">
        <div class="var_paragraph">
            <p>${htmlVarHeader}</p>
        </div>
        <div class="edit_var">
            <input id="${boardName}_${varName}_value" type="text" name="{varName}_value" value = ${value}><br>
        </div>
    </div>
`;
  }
  console.log(container)
  document.getElementById("generic_grid").appendChild(container);
}

function addReadContainer(boardName, varName, value, unit) {
  const container = document.createElement("div");
  container.className = "control_container";
  container.innerHTML = `
      <div class="var_ctrl_container">
          <div class="var_paragraph">
              <p>${varName}:</p>
          </div>
          <p>
              <span id="${boardName}_${varName}_value">${value}</span><span> ${unit}</span>
          </p>
      </div>
  `;

  console.log(container)
  document.getElementById("generic_grid").appendChild(container);
}

const updateValue = (data) => {
    const { Boardname, Variablename, Value } = data;
    const board = window.boards.find(b => b.name === Boardname);

    if (!board) {
      console.warn(`Board "${Boardname}" nicht gefunden.`);
      return;
    }

    if (Variablename in board) {
      window.boards[Variablename] = Value;
      if (board.name.startsWith("pH-Board")){
        const text_id = document.getElementById(`pH-Board_${Variablename}`);
        if (text_id){
          text_id.innerText = parseFloat(Value).toFixed(2);
        }
      } else if (board.name.startsWith("LC")){
        const text_id = document.getElementById(`LC_${Variablename}`);
        if (text_id){
          text_id.innerText = parseFloat(Value).toFixed(2);
        }
      } else if (!board.name.startsWith("Beacon")){
        const text_id = document.getElementById(`${board.name}_${Variablename}_value`);
          if (text_id){
            text_id.innerText = parseFloat(Value).toFixed(2);
          }
      }else if (board.name.startsWith("Beacon")){
          console.log(data)
      }
    } else {
      console.warn(`Variable "${Variablename}" in ${Boardname} nicht gefunden.`);
    }
}

const lc_data = {
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

const LCChartConfig = {
  type: 'line',
  data: lc_data,
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

const PHChartConfig = {
  type: 'line',
  data: lc_data,
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




