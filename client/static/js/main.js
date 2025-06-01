const socket = io();
window.socket = socket;
window.activeBoard = null;
let boards = []
window.lcPlotStatus;
window.phPlotStatus;

document.addEventListener("DOMContentLoaded", () => {
    window.activeBoard = sessionStorage.getItem("activeBoard"); //Load active board from storage (null when no board was previously active)
    if (window.activeBoard) {
        document.getElementById("board_name").innerText = window.activeBoard;
    }
});

// updates the navigation board list
updateBoardList = () => {
    const boardList = document.getElementById("board_list");
    const existingIds = new Set(
        Array.from(boardList.querySelectorAll("li")).map(li => li.dataset.id)
    );
    boards.forEach(board => {
        if (!existingIds.has(String(board.id))) {
            // Create a new navigation tab for the board
            let listItem = document.createElement("li");
            listItem.dataset.id = board.id;

            // Link the navigation tab to a page
            let link = document.createElement("a");
            link.href = `/board/${board.name}`;
            link.textContent = board.name;
            listItem.appendChild(link);
            boardList.appendChild(listItem);

            link.addEventListener("click", (e) => {
                sessionStorage.setItem("activeBoard", board.name);
                window.activeBoard = board.name;
                document.getElementById("board_name").innerText = board.name;
            });
        }
    });
};

// send a variable update to the server
window.sendVariableUpdate = (boardname, variable, value) => {
    const msg = {
        Boardname: boardname,
        Variablename: variable,
        Value: value
    };
    socket.send(JSON.stringify(msg)); 
}

// send the plot state to the sever (true = start plotting, false = stop plotting)
window.sendPlotState = (boardname, variable, state) => {
    const msg = {
        Boardname: boardname,
        Variablename: variable,
        Plotstate: state  
    };
    window.socket.send(JSON.stringify(msg)); 
}

// update the value in the board array
const updateBoardValue = (boardName, variableName, value) => {
    const board = boards.find(b => b.name === boardName);
    if (board) {
        board[variableName] = value;
    }
}

// new board was added
socket.on('NewBoard', (data) => {
    addNewBoard(data);
});

// plot data are sent to be displayed on the chart
socket.on('PlotData', (data) => {
    const boardName = data.Boardname;
    const variableName = data.Variablename;
    const values = data.Valuelist;
    const plotState = data.PlotState;

    if (boardName == window.activeBoard){
        if (boardName.startsWith("LC")){
            window.lcPlotStatus = plotState;
            if (variableName == "Weight"){
                addDataArray(loadCellChart, variableName, values);
            }
        } else if (boardName.startsWith("pH-Board")){
            window.phPlotStatus = plotState;
              if (variableName == "temp_sht"){
                  addDataArray(phSensorChart, variableName, values);
              }
        }
    }
});

//A new value was received 
socket.on('NewValue', (data) => {
    updateValue(data);
    const boardName = data.Boardname;

    if (boardName == window.activeBoard){
        if (boardName.startsWith("LC")){
          if (window.lcPlotStatus){
              const variableName = data.Variablename;
              if (variableName == "Weight"){
                  const value = data.Value;
                  addSingleDataPoint(loadCellChart, variableName, value);
              }
          }
        } else if (boardName.startsWith("pH-Board")){
            if (window.phPlotStatus){
                const variableName = data.Variablename;
                if (variableName == "temp_sht"){
                    const value = data.Value;
                    addSingleDataPoint(phSensorChart, variableName, value);
                }
            }
        }
    }
});

// Adds a new board to the UI
const addNewBoard = (data) =>  {
    const boardName = data.Name;

    if (boardName.startsWith("Beacon")){
        template = "beacon.html";
    } else if (boardName.startsWith("pH-Board")){
        template = "ph_sensorboard.html"
    } else if (boardName.startsWith("LC")){
        template = "load_cell.html"
    } else {
        template = "generic.html"
    }

    let board = boards.find(b => b.name === boardName);
  
    if (!board) {
        board = {
            id: boards.length + 1,
            name: boardName,
            template
        };
        boards.push(board); 
    }
  
    data.Variables.forEach(v => {
        board[v.Name] = v.Value;
    });
    updateBoardList();
    if (window.activeBoard == boardName){
        if (boardName.startsWith("LC")){
            const board = boards.find(b => b.name === window.activeBoard);
            if (!loadCellChart){
                loadCellChart = new Chart(document.getElementById('load_cell_chart').getContext('2d'), config);
                document.getElementById('load_cell_chart').style.backgroundColor = 'rgb(226, 232, 235)';
            }
            if (board){
                document.getElementById("gradient_value").value = board.Gradient;
                document.getElementById("offset_value").value = board.Offset;
        
                for (let key in board) {
                    const text_id = document.getElementById(`LC_${key}`);
                    if (text_id){
                        text_id.innerText = parseFloat(board[key]).toFixed(2);
                    }
                }
            }
        } else if (boardName.startsWith("pH-Board")){
            const board = boards.find(b => b.name === window.activeBoard);
            if(!phSensorChart){
                phSensorChart = new Chart(document.getElementById('ph_chart').getContext('2d'), config);
                document.getElementById('ph_chart').style.backgroundColor = 'rgb(226, 232, 235)';
            }
            if (board){
                for (let key in board) {
                    const text_id = document.getElementById(`pH-Board_${key}`);
                    if (text_id){
                        text_id.innerText = parseFloat(board[key]).toFixed(2);
                    }
                }
            }
        } else if (boardName.startsWith("Beacon")){
            window.initBeaconPage();
        } else {
            data.Variables.forEach(v => {
                if (v.Permission == "eRead"){
                    addReadContainer(boardName, v.Name, parseFloat(v.Value).toFixed(2), v.Unit);
                } else if ((v.Permission == "eReadWrite")){
                    addReadWriteContainer(boardName, v.Name, parseFloat(v.Value).toFixed(2), v.Unit);
                    document.getElementById(`${boardName}_${v.Name}_value`).addEventListener("keydown", (e) => {
                        if (e.key === "Enter") {
                            e.preventDefault(); 
                            window.sendVariableUpdate(window.activeBoard, v.Name, document.getElementById(`${boardName}_${v.Name}_value`).value);
                        }
                    });
                }
            });
        }
    }
}

// generates a generic readwrite container with textinput for the generic template
function addReadWriteContainer(boardName, varName, value, unit) {
    const container = document.createElement("div");
    container.className = "generic-generate-container";
    if (unit == " "){
        container.innerHTML = `
            <div class="generic-container">
                <div class="generic-var-name-container">
                    <p>${varName}</p>
                </div>
                <div class="generic-write-input-container">
                    <input id="${boardName}_${varName}_value" type="text" name="{varName}_value" value = ${value}><br>
                </div>
            </div>
        `;
    } else {
        const htmlVarHeader = `<p>${varName} (${unit})</p>`;
        container.innerHTML = `
            <div class="generic-container">
                <div class="generic-var-name-container">
                    <p>${htmlVarHeader}</p>
                </div>
                <div class="generic-write-input-container">
                    <input id="${boardName}_${varName}_value" type="text" name="{varName}_value" value = ${value}><br>
                </div>
            </div>
        `;
    }
    document.getElementById("genericGrid").appendChild(container);
}

// generates a generic read container for the generic template
function addReadContainer(boardName, varName, value, unit) {
    const container = document.createElement("div");
    container.className = "generic-generate-container";
    container.innerHTML = `
        <div class="generic-container">
            <div class="generic-var-name-container">
                <p>${varName}</p>
            </div>
            <p>
                <span id="${boardName}_${varName}_value">${value}</span><span> ${unit}</span>
            </p>
        </div>
    `;
    document.getElementById("genericGrid").appendChild(container);
}

// update a value in the UI
const updateValue = (data) => {
    const boardName = data.Boardname;
    const variableName = data.Variablename;
    const value = data.Value;

    const board = boards.find(b => b.name === boardName);
    if (!board) {
        //board does not exist
        return;
    }

    if (variableName in board) {
        boards[variableName] = value; //update value
        if (board.name.startsWith("pH-Board")){
            const text_id = document.getElementById(`pH-Board_${variableName}`);
            if (text_id){
                text_id.innerText = parseFloat(value).toFixed(2);
            }
        } else if (board.name.startsWith("LC")){
            const text_id = document.getElementById(`LC_${variableName}`);
            if (text_id){
                text_id.innerText = parseFloat(value).toFixed(2);
            }
        } else if (!board.name.startsWith("Beacon")){
            const text_id = document.getElementById(`${board.name}_${variableName}_value`);
            if (text_id){
                text_id.innerText = parseFloat(value).toFixed(2);
            }
        }
    }
}

// Adds an Array to the chart
const addDataArray = (chart, datasetLabel, dataArray) => {
    const dataset = chart.data.datasets.find(ds => ds.label === datasetLabel);
    if (!dataset) {
        return;
    }
    dataArray.forEach(value => {
        chart.data.labels.push(plotCounter++);
        dataset.data.push(value);
    });
    chart.update();
};

// Add one datapoint to the chart
const addSingleDataPoint = (chart, datasetLabel, value) => {
    const dataset = chart.data.datasets.find(ds => ds.label === datasetLabel);
    if (!dataset) {
        return;
    }
    chart.data.labels.push(plotCounter++);
    dataset.data.push(value);
    chart.update();
};

