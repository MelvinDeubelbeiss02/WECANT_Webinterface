    //------------------Beacon--------------------

let modeHandle = null;
const n_rows = 7;
const n_columns = 5;
let beacon_mode = "single_color"; //default
let frequency = 1;
let beacon_color = ["rgb(0, 0, 0)", "rgb(0, 0, 0)"];
let brightness = 100;
let brightness_onoff_flag = 1;
let active_colorpicker_idx = 0;
let colorPicker = null;


document.addEventListener("DOMContentLoaded", () => {
    
    document.getElementById("minus_brightness_btn").addEventListener("click", () => {
            if(!brightness_onoff_flag){
               return
            }
            if (brightness > 0){
                brightness = brightness - 10;
                console.log("minusbrightness", brightness);
                //brightness_onoff_flag == 1;
            }
            sessionStorage.setItem("brightness", brightness);
            setBrightness(brightness);
            show_solid_color(beacon_color[active_colorpicker_idx]);
     });

    document.getElementById("plus_brightness_btn").addEventListener("click", () => {
        if(!brightness_onoff_flag){
            return
        }
        if (brightness < 100){
            brightness = brightness + 10;
            console.log("plusbrightness", brightness);
            //brightness_onoff_flag == 1;
        }
        sessionStorage.setItem("brightness", brightness);
        setBrightness(brightness);
        show_solid_color(beacon_color[active_colorpicker_idx]);
    });
    
    document.getElementById("onoff_brightness_btn").addEventListener("click", () => {
        console.log("onoffbrightness");
        if (brightness_onoff_flag == 1){
            brightness_onoff_flag = 0;
            setBrightness(0);
            sessionStorage.setItem("brightness_onoff_flag", 0);
            document.getElementById("onoff_brightness_btn").style.backgroundColor = 'rgb(222, 127, 131)';
            stop_Mode();
            show_solid_color("rgb(0, 0, 0)");
        } else {
            brightness_onoff_flag = 1;
            setBrightness(brightness);
            sessionStorage.setItem("brightness_onoff_flag", 1);
            document.getElementById("onoff_brightness_btn").style.backgroundColor = 'rgb(142, 226, 184)';
            stop_Mode();
            start_Mode(beacon_color, beacon_mode, frequency, active_colorpicker_idx);
        }
    });

    document.getElementById("single_color").addEventListener("click", () => {
        console.log("single color");
        document.getElementById(beacon_mode).style.backgroundColor = 'rgb(226, 232, 235)'
        beacon_mode = "single_color";
        sessionStorage.setItem("active_mode", beacon_mode);
        document.getElementById(beacon_mode).style.backgroundColor = 'rgb(149, 207, 195)';
        stop_Mode();
        start_Mode(beacon_color, beacon_mode, frequency, active_colorpicker_idx);
    });

    document.getElementById("blinking_color").addEventListener("click", () => {
        console.log("blinking_color color");
        document.getElementById(beacon_mode).style.backgroundColor = 'rgb(226, 232, 235)'
        beacon_mode = "blinking_color";
        sessionStorage.setItem("active_mode", beacon_mode);
        document.getElementById(beacon_mode).style.backgroundColor = 'rgb(149, 207, 195)';
        stop_Mode();
        start_Mode(beacon_color, beacon_mode, frequency, active_colorpicker_idx);
    });

    document.getElementById("horizontal_cycling").addEventListener("click", () => {
        console.log("horizontal_cycling");
        document.getElementById(beacon_mode).style.backgroundColor = 'rgb(226, 232, 235)'
        beacon_mode = "horizontal_cycling";
        sessionStorage.setItem("active_mode", beacon_mode);
        document.getElementById(beacon_mode).style.backgroundColor = 'rgb(149, 207, 195)';
        stop_Mode();
        start_Mode(beacon_color, beacon_mode, frequency, active_colorpicker_idx);
    });

    document.getElementById("vertical_cycling").addEventListener("click", () => {
        console.log("vertical_cycling");
        document.getElementById(beacon_mode).style.backgroundColor = 'rgb(226, 232, 235)'
        beacon_mode = "vertical_cycling";
        sessionStorage.setItem("active_mode", beacon_mode);
        document.getElementById(beacon_mode).style.backgroundColor = 'rgb(149, 207, 195)';
        stop_Mode();
        start_Mode(beacon_color, beacon_mode, frequency, active_colorpicker_idx);
    });

    document.getElementById("frequency_value").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); 
            handleFrequencyInput();
        }
    });

    document.getElementById("frequency_value").addEventListener("change", () => {
        handleFrequencyInput();
    });

    document.getElementById("color1_btn").addEventListener("click", () => {
        console.log("color1_btn");
        active_colorpicker_idx = 0;
        colorPicker.color.rgbString = beacon_color[active_colorpicker_idx];
        document.getElementById("color_num_value").innerText = "1";
        sessionStorage.setItem("active_color", active_colorpicker_idx);
        document.getElementById("color2_btn").style.backgroundColor = 'rgb(226, 232, 235)';
        document.getElementById("color1_btn").style.backgroundColor = 'rgb(149, 207, 195)';
        
    });

    document.getElementById("color2_btn").addEventListener("click", () => {
        console.log("color2_btn");
        active_colorpicker_idx = 1;
        colorPicker.color.rgbString = beacon_color[active_colorpicker_idx];
        document.getElementById("color_num_value").innerText = "2";
        sessionStorage.setItem("active_color", active_colorpicker_idx);
        document.getElementById("color1_btn").style.backgroundColor = 'rgb(226, 232, 235)';
        document.getElementById("color2_btn").style.backgroundColor = 'rgb(149, 207, 195)';
    });

    colorPicker = new iro.ColorPicker(".colorPicker", {
        width: 280,
        color: "rgb(0, 0, 0)",
        borderWidth: 1,
        borderColor: "#fff" 
    });

    colorPicker.on(["color:change"], function (color) {
        console.log(color.rgbString);
        beacon_color[active_colorpicker_idx] = color.rgbString;
        console.log(active_colorpicker_idx)
        if (active_colorpicker_idx == 0){
            console.log("color1", color.rgbString)
            sessionStorage.setItem("color1", color.rgbString);
            console.log(sessionStorage.getItem("color1"))
        } else {
            console.log("color2", color.rgbString)
            sessionStorage.setItem("color2", color.rgbString);
        }
        stop_Mode();
        start_Mode(beacon_color, beacon_mode, frequency, active_colorpicker_idx);
      });  
});


const handleFrequencyInput = ()  => {
    const inputValue = document.getElementById("frequency_value").value.trim();
    if (!isNaN(inputValue) && inputValue !== "") {
        console.log("Es ist eine Zahl!");
        frequency = inputValue;
        sessionStorage.setItem("frequency", frequency);
        stop_Mode();
        start_Mode(beacon_color, beacon_mode, frequency, active_colorpicker_idx);
    } else {
        document.getElementById("frequency_value").value = frequency; 
        console.log("Es ist keine Zahl!");
    }
};

const stop_Mode = () => {
    clearInterval(modeHandle);
};

const start_Mode = (colors, mode, frequency = 1, active_colorpicker_idx = 0) => {
    if (mode == "single_color"){
        modeHandle = show_solid_color(colors[active_colorpicker_idx]);
    } else if (mode == "blinking_color"){
        modeHandle = start_blinking_beacon(colors, frequency);
    } else if (mode == "horizontal_cycling"){
        modeHandle = start_horizontal_cycling_beacon(colors, frequency);
    } else if (mode == "vertical_cycling"){
        modeHandle = start_vertical_cycling_beacon(colors, frequency);
    } 
};

const changeBeaconColor = (row, column, color) => {
    const cellID = `cell_${column}_${row}`;
    const rect = document.getElementById(cellID);
    if (rect) {
      rect.setAttribute('fill', color);
    }
}


const show_solid_color = (color) => {
    if (!brightness_onoff_flag){
        color = "rgb(0, 0, 0)";
        console.log("OffFlag")
    }
    const [_, r, g, b] = String(color).match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    console.log([r, g, b])
    window.sendVariableUpdate('Beacon', 'Red', parseInt(r * brightness / 100));
    window.sendVariableUpdate("Beacon", "Blue", parseInt(b * brightness / 100));
    window.sendVariableUpdate("Beacon", "Green", parseInt(g * brightness / 100));
    console.log(brightness);
    for (let row = 0; row < n_rows; row++) {
        for (let column = 0; column < n_columns; column++) {
            changeBeaconColor(row, column, color);
        }
    }
}

const show_row = (row, color) => {
    for (let column = 0; column < n_columns; column++) {
        changeBeaconColor(row, column, color);
    }
}

const show_column = (column, color) => {
    for (let row = 0; row < n_rows; row++) {
        changeBeaconColor(row, column, color);
    }
}

const start_blinking_beacon = (colors, frequency = 1) =>  {
    const interval = 1/frequency * 1000;
    let colorflag = 0; 
    return setInterval(() => {
        if (colorflag == 0) {
            show_solid_color(colors[colorflag]);
            colorflag = 1;
        } else {
            show_solid_color(colors[colorflag]);
            colorflag = 0;
        }
    }, interval);
}

const start_vertical_cycling_beacon = (colors, frequency = 1) =>  {
    const interval = 1/frequency * 1000;
    let colorflag = 0; 
    let active_row = 0;
    show_solid_color(colors[0]);
    return setInterval(() => {
        show_row(active_row, colors[1]);
        if (active_row == 0){
            show_row(n_rows, colors[0]);
        } else {
            show_row(active_row - 1, colors[0]);
        }
        if (active_row == n_rows){
            active_row = 0;
        }  else {
            active_row ++;
        }
    }, interval);
}

const start_horizontal_cycling_beacon = (colors, frequency = 1) =>  {
    const interval = 1/frequency * 1000;
    let colorflag = 0; 
    let active_column= 0;
    show_solid_color(colors[0]);
    return setInterval(() => {
        show_column(active_column, colors[1]);
        if (active_column == 0){
            show_column(n_columns, colors[0]);
        } else {
            show_column(active_column - 1, colors[0]);
        }
        if (active_column == n_columns){
            active_column = 0;
        }  else {
            active_column ++;
        }
    }, interval);
}


window.initBeaconPage = () => {
    if( parseInt(sessionStorage.getItem("brightness"))){
        brightness = parseInt(sessionStorage.getItem("brightness"));
    } else {
        brightness = 100; //Default value
    }
    const color1 = sessionStorage.getItem("color1");
    const color2 = sessionStorage.getItem("color2");
    beacon_color = [color1, color2];
    if(sessionStorage.getItem("frequency")){
        frequency = sessionStorage.getItem("frequency");
    } else {
        frequency = 1; //Default value
    }
    console.log("flag",sessionStorage.getItem("brightness_onoff_flag"))
    if(parseInt(sessionStorage.getItem("brightness_onoff_flag")) == 0){
        brightness_onoff_flag = parseInt(sessionStorage.getItem("brightness_onoff_flag"));
        document.getElementById("onoff_brightness_btn").style.backgroundColor = 'rgb(222, 127, 131)';
    } else{
        brightness_onoff_flag = 1;
        document.getElementById("onoff_brightness_btn").style.backgroundColor = 'rgb(142, 226, 184)';
    }
    
    active_colorpicker_idx = parseInt(sessionStorage.getItem("active_color"));
    beacon_mode =  sessionStorage.getItem("active_mode");
    document.getElementById("frequency_value").value = frequency;

    console.log(brightness, "logged");
    if (beacon_mode){
        document.getElementById(beacon_mode).style.backgroundColor = 'rgb(149, 207, 195)';
    } else {
        beacon_mode = "single_color";
        document.getElementById("single_color").style.backgroundColor = 'rgb(149, 207, 195)';
    }

    if (active_colorpicker_idx == 0){
        console.log("color1 load")
        colorPicker.color.set(color1);
        show_solid_color(color1)
        document.getElementById("color2_btn").style.backgroundColor = 'rgb(226, 232, 235)';
        document.getElementById("color1_btn").style.backgroundColor = 'rgb(149, 207, 195)';
    } else if (active_colorpicker_idx == 1){
        console.log("color2 load")
        document.getElementById("color_num_value").innerText = "2";
        colorPicker.color.set(color2);
        show_solid_color(color2);
        document.getElementById("color1_btn").style.backgroundColor = 'rgb(226, 232, 235)';
        document.getElementById("color2_btn").style.backgroundColor = 'rgb(149, 207, 195)';
    }
    setBrightness(brightness);

}

const setBrightness = (percentage) => {
    const circle = document.querySelector('.ring');
    if (circle) {
        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference * (1 - percentage / 100);
        circle.style.strokeDashoffset = offset;
    }
};

//------------------ End Beacon---------------------