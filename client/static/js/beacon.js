let modeHandle = null;
const nRows = 7;
const nColumns = 5;
let beaconMode = "single_color"; // default
let frequency = 1; // default
let beaconColor = ["rgb(0, 0, 0)", "rgb(0, 0, 0)"]; // default
let brightness = 100; // default
let brightnessOnOffFlag = 1; // default
let activeColorPickerIdx = 0; // default
let colorPicker = null;
let debounceTimeout; // Timeout Handle for the Color Picker
let brightnessStepSize = 10; // Stepsize in which brightness can be increased. Should be a divider of 100

document.addEventListener("DOMContentLoaded", () => {
    // create Color Picker
    colorPicker = new iro.ColorPicker(".color-picker", {
        width: 280,
        color: "rgb(0, 0, 0)",
        borderWidth: 1,
        borderColor: "#fff" 
    });

    document.getElementById("minus_brightness_btn").addEventListener("click", () => {
            if(!brightnessOnOffFlag){
                //Beacon is switched off 
                return 
            }
            if (brightness > 0){
                //decrease brightness by brightnessStepSize
                brightness = brightness - brightnessStepSize;
                if (brightness < 0){
                    brightness = 0;
                }
            }
            sessionStorage.setItem("brightness", brightness); //store brightness so that it is saved when a reload is performed
            setBrightness(brightness);
            showSolidColor(beaconColor[activeColorPickerIdx]);
     });

    document.getElementById("plus_brightness_btn").addEventListener("click", () => {
        if(!brightnessOnOffFlag){
            //Beacon is switched off 
            return
        }
        if (brightness < 100){
            //increase brightness by brightnessStepSize
            brightness = brightness + brightnessStepSize;
            if (brightness > 100){
                brightness = 100;
            }
        }
        sessionStorage.setItem("brightness", brightness); //store brightness so that it is saved when a reload is performed
        setBrightness(brightness);
        showSolidColor(beaconColor[activeColorPickerIdx]);
    });
    
    document.getElementById("onoff_brightness_btn").addEventListener("click", () => {
        if (brightnessOnOffFlag == 1){
            //Switch off beacon
            brightnessOnOffFlag = 0;
            setBrightness(0);
            sessionStorage.setItem("brightnessOnOffFlag", 0); 
            document.getElementById("onoff_brightness_btn").style.backgroundColor = 'rgb(222, 127, 131)';
            stopMode(); 
            showSolidColor("rgb(0, 0, 0)");
        } else {
            //Switch on beacon
            brightnessOnOffFlag = 1;
            setBrightness(brightness);
            sessionStorage.setItem("brightnessOnOffFlag", 1);
            document.getElementById("onoff_brightness_btn").style.backgroundColor = 'rgb(142, 226, 184)';
            stopMode();
            startMode(beaconColor, beaconMode, frequency, activeColorPickerIdx);
        }
    });

    document.getElementById("single_color").addEventListener("click", () => {
        // Starts mode to display a single color on beacon
        changeMode("single_color");
    });

    document.getElementById("blinking_color").addEventListener("click", () => {
        // Starts mode to display blinking colors(color1 and color2) on beacon with the given input frequency (textinput) 
        changeMode("blinking_color");
    });

    document.getElementById("horizontal_cycling").addEventListener("click", () => {
        // Starts horizontal cyling mode on beacon with the given input frequency (textinput) 
        changeMode("horizontal_cycling");
    });

    document.getElementById("vertical_cycling").addEventListener("click", () => {
        // Starts vertical cyling mode on beacon with the given input frequency (textinput)
        changeMode("vertical_cycling");
    });

    document.getElementById("frequency_value").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            // frequency input got confirmed with enter key
            e.preventDefault(); 
            handleFrequencyInput();
        }
    });

    document.getElementById("color1_btn").addEventListener("click", () => {
        // Switch to beacon color 1
        activeColorPickerIdx = 0;
        colorPicker.color.rgbString = beaconColor[activeColorPickerIdx];
        document.getElementById("color_num_value").innerText = "1";
        sessionStorage.setItem("activeColor", activeColorPickerIdx);
        document.getElementById("color1_btn").style.backgroundColor = 'rgb(149, 207, 195)';
        document.getElementById("color2_btn").style.backgroundColor = 'rgb(226, 232, 235)';
        stopMode();
        startMode(beaconColor, beaconMode, frequency, activeColorPickerIdx);
    });

    document.getElementById("color2_btn").addEventListener("click", () => {
        //Switch to beacon color 2
        activeColorPickerIdx = 1;
        colorPicker.color.rgbString = beaconColor[activeColorPickerIdx];
        document.getElementById("color_num_value").innerText = "2";
        sessionStorage.setItem("activeColor", activeColorPickerIdx);
        document.getElementById("color1_btn").style.backgroundColor = 'rgb(226, 232, 235)';
        document.getElementById("color2_btn").style.backgroundColor = 'rgb(149, 207, 195)';
        stopMode();
        startMode(beaconColor, beaconMode, frequency, activeColorPickerIdx);
    });

    colorPicker.on(["color:change"], function (color) {
        beaconColor[activeColorPickerIdx] = color.rgbString;
        if (activeColorPickerIdx == 0){
            sessionStorage.setItem("color1", color.rgbString);
        } else {
            sessionStorage.setItem("color2", color.rgbString);
        }
        // Prevent WebSocket overload – STM32 (ICANT) can't keep up with rapid color changes.
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(function() {
                stopMode();
                startMode(beaconColor, beaconMode, frequency, activeColorPickerIdx);
        }, 300);
      });  
});

// Handles a change in beacon mode
const changeMode = (newMode)  => {
    document.getElementById(beaconMode).style.backgroundColor = 'rgb(226, 232, 235)';
    beaconMode = newMode;
    sessionStorage.setItem("activeMode", beaconMode);
    document.getElementById(beaconMode).style.backgroundColor = 'rgb(149, 207, 195)';
    stopMode();
    startMode(beaconColor, beaconMode, frequency, activeColorPickerIdx);
};

// Handles a change in the frequency text input
const handleFrequencyInput = ()  => {
    const inputValue = document.getElementById("frequency_value").value.trim();
    //check if frequency input is valid
    if (!isNaN(inputValue) && inputValue !== "") {
        frequency = inputValue;
        sessionStorage.setItem("frequency", frequency);
        stopMode();
        startMode(beaconColor, beaconMode, frequency, activeColorPickerIdx);
    } else {
        //input was not a naumber
        document.getElementById("frequency_value").value = frequency; 
    }
};

// stops the currently running mode
const stopMode = () => {
    if (modeHandle){
        // Clear existing mode interval
        clearInterval(modeHandle); 
    }
};

// starts a new mode  
const startMode = (colors, mode, frequency = 1, activeColorPickerIdx = 0) => {
    if (mode == "single_color"){
        modeHandle = showSolidColor(colors[activeColorPickerIdx]);
    } else if (mode == "blinking_color"){
        modeHandle = startBlinkingBeacon(colors, frequency);
    } else if (mode == "horizontal_cycling"){
        modeHandle = startHorizontalCyclingBeacon(colors, frequency);
    } else if (mode == "vertical_cycling"){
        modeHandle = startVerticalCyclingBeacon(colors, frequency);
    } 
};

// Sets the digital beacon's rectangle to a specific color
const changeBeaconColor = (row, column, color) => {
    const cellID = `cell_${column}_${row}`;
    const rect = document.getElementById(cellID);
    if (rect) {
      rect.setAttribute('fill', color);
    }
}

// Colors the beacon with a single color
const showSolidColor = (color) => {
    if (!brightnessOnOffFlag){
        // Beacon is switched off
        color = "rgb(0, 0, 0)";
    }
    const [_, r, g, b] = String(color).match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/); // Extract the Red, Green and Blue value

    // Send Red, Green and Blue values to beacon
    window.sendVariableUpdate(window.activeBoard, 'Red', parseInt(r * brightness / 100));
    window.sendVariableUpdate(window.activeBoard, "Blue", parseInt(b * brightness / 100));
    window.sendVariableUpdate(window.activeBoard, "Green", parseInt(g * brightness / 100));

    // Colors the digital beacon
    for (let row = 0; row < nRows; row++) {
        for (let column = 0; column < nColumns; column++) {
            changeBeaconColor(row, column, color);
        }
    }
}

const showRow = (row, color) => {
    // Colors a single row of the digital beacon
    for (let column = 0; column < nColumns; column++) {
        changeBeaconColor(row, column, color);
    }
}

const showColumn = (column, color) => {
    // Colors a single column of the digital beacon
    for (let row = 0; row < nRows; row++) {
        changeBeaconColor(row, column, color);
    }
}

const startBlinkingBeacon = (colors, frequency = 1) =>  {
    // Starts the blinking mode of the beacon
    const interval = 1/frequency * 1000;
    let colorFlag = 0; 
    return setInterval(() => {
        if (colorFlag == 0) {
            showSolidColor(colors[colorFlag]);
            colorFlag = 1;
        } else {
            showSolidColor(colors[colorFlag]);
            colorFlag = 0;
        }
    }, interval);
}

const startVerticalCyclingBeacon = (colors, frequency = 1) =>  {
    // Starts the vertical cycling mode of the digital beacon
    const interval = 1/frequency * 1000;
    let activeRow = 0;
    showSolidColor(colors[0]);
    return setInterval(() => {
        showRow(activeRow, colors[1]);
        if (activeRow == 0){
            showRow(nRows, colors[0]);
        } else {
            showRow(activeRow - 1, colors[0]);
        }
        if (activeRow == nRows){
            activeRow = 0;
        }  else {
            activeRow ++;
        }
    }, interval);
}

// Starts the horizontal cycling mode of the digital beacon
const startHorizontalCyclingBeacon = (colors, frequency = 1) =>  {
    const interval = 1/frequency * 1000;
    let activeColumn= 0;
    showSolidColor(colors[0]);
    return setInterval(() => {
        showColumn(activeColumn, colors[1]);
        if (activeColumn == 0){
            showColumn(nColumns, colors[0]);
        } else {
            showColumn(activeColumn - 1, colors[0]);
        }
        if (activeColumn == nColumns){
            activeColumn = 0;
        }  else {
            activeColumn ++;
        }
    }, interval);
}

//displays the brightness visually on the ring
const setBrightness = (percentage) => {
    const circle = document.querySelector('.ring');
    if (circle) {
        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference * (1 - percentage / 100);
        circle.style.strokeDashoffset = offset;
    }
};

// Initializes elements on a reload
window.initBeaconPage = () => {
    if ( parseInt(sessionStorage.getItem("brightness"))){
        // Set brightness from storage
        brightness = parseInt(sessionStorage.getItem("brightness"));
    } else {
        // Set default value
        brightness = 100; 
    }

    if (parseInt(sessionStorage.getItem("brightnessOnOffFlag")) == 0){
        // Set brightness flag to 0 (Beacon switched off)
        brightnessOnOffFlag = 0;
        document.getElementById("onoff_brightness_btn").style.backgroundColor = 'rgb(222, 127, 131)';
    } else{
        //Set brightness flag to 1 (Beacon switched on)
        brightnessOnOffFlag = 1;
        document.getElementById("onoff_brightness_btn").style.backgroundColor = 'rgb(142, 226, 184)';
    }
    setBrightness(brightness);

    if (sessionStorage.getItem("frequency")){
        // Set frequency from storage
        frequency = sessionStorage.getItem("frequency");
    } else {
        // Set default value
        frequency = 1;
    }
    document.getElementById("frequency_value").value = frequency;
    
    if (sessionStorage.getItem("activeMode")){
        // Set beacon mode from storage
        beaconMode =  sessionStorage.getItem("activeMode");
        //changeMode(beaconMode)
    } else {
        //Default mode
        beaconMode = "single_color";
        document.getElementById("single_color").style.backgroundColor = 'rgb(149, 207, 195)';
    }

    const color1 = sessionStorage.getItem("color1");
    if (color1){
        // Load color 1 from storage
        beaconColor[0] = color1;
    }
    const color2 = sessionStorage.getItem("color2");
    if (color2){
        // Load color 2 from storage
        beaconColor[1] = color2;
    }

    activeColorPickerIdx = parseInt(sessionStorage.getItem("activeColor"));
    if (activeColorPickerIdx == 1){
        //Display color picker with color 2
        colorPicker.color.set(beaconColor[1]);
        showSolidColor(beaconColor[1]);         
        document.getElementById("color_num_value").innerText = "2";
        document.getElementById("color1_btn").style.backgroundColor = 'rgb(226, 232, 235)';
        document.getElementById("color2_btn").style.backgroundColor = 'rgb(149, 207, 195)';
    } else {
        //Display color picker with color 1(default)
        activeColorPickerIdx == 0;
        colorPicker.color.set(beaconColor[0]);
        showSolidColor(beaconColor[0]);
        document.getElementById("color_num_value").innerText = "1";
        document.getElementById("color1_btn").style.backgroundColor = 'rgb(149, 207, 195)';
        document.getElementById("color2_btn").style.backgroundColor = 'rgb(226, 232, 235)';
    }
}


