from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
import sys
import os
import threading
import logging

# Add 'PythonModules' to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
pythonModules_dir = os.path.join(current_dir, 'PythonModules')
sys.path.append(pythonModules_dir)

import wecantInterface as wecant

# Connect to WECANT
wecant.connect_icant("172.16.10.82", 8080)

# Disable unnecessary logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# Initialize Flask
app = Flask(__name__, static_folder = os.path.join(os.path.pardir, "client", "static"), template_folder = os.path.join(os.path.pardir, "client", "templates"))
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins = "*", async_mode = 'threading')


def new_board_callback(board_data):
    """
    Emit a new board configuration to connected WebSocket clients

    Parameters
    ----------
    boardData : dict
        Dictionary of board data to send.

    Returns
    -------
    None.

    """
    socketio.start_background_task(socketio.emit, 'NewBoard', board_data)


def new_variable_callback(variable_data):
    """
    Emit a new variable value to connected WebSocket clients

    Parameters
    ----------
    variableData : dict
        Dictionary of variable data to send.

    Returns
    -------
    None.

    """
    socketio.start_background_task(socketio.emit, 'NewValue', variable_data)


@app.route('/')
def index():
    """
    Render the default index page.

    Returns
    -------
    Text
        The rendered index page.

    """
    print("Render Default Page")
    return render_template('index.html')

@app.route("/board/<string:board_name>")
def show_board(board_name):
    """
    Render the board specific page.

    Returns
    -------
    Text
        The rendered board specific page.

    """
    if board_name.startswith("Beacon"):
        return render_template("beacon.html")
    elif board_name.startswith("LC"):
        return render_template("load_cell.html")
    elif board_name.startswith("pH-Board"):
        return render_template("ph_sensorboard.html")
    else:
        return render_template("generic.html")

@socketio.on('message')
def handle_message(msg):
    """
    Handle incoming WebSocket messages

    Parameters
    ----------
    msg : str / dict
        JSON string or dictionary of board name, variable name and value.

    Returns
    -------
    None.

    """
    wecant.handle_received_data(msg)


@socketio.on('connect')
def handle_connect():
    """
    Handle a new WebSocket client connection

    Returns
    -------
    None.

    """
    list_of_board_configs = wecant.get_all_board_configs()

    for board in list_of_board_configs:
        socketio.emit('NewBoard', board, to=request.sid)
        
    list_of_plot_data = wecant.get_plot_data()
    for plot_data in list_of_plot_data:
        socketio.emit('PlotData', plot_data, to=request.sid)


def run_server():
    """
    Run the Flask-SocketIO server

    Returns
    -------
    None.

    """
    socketio.run(app, debug=False, use_reloader=False,
                 allow_unsafe_werkzeug=True, port=5000, host='0.0.0.0')


# Start webserver thread
server_thread = threading.Thread(target=run_server)
server_thread.start()

# Start WECANT thread
wecant_thread = threading.Thread(target=wecant.wecant_receive_thread, args=(
    new_board_callback, new_variable_callback))
wecant_thread.start()
