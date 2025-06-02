import struct
import copy
import socket
import time
import json
import threading

# Threadsafety
holy_dict_lock = threading.RLock()
plot_dict_lock = threading.RLock()

# Dictionary for all board and variable information
holy_dict = {}

# Dictionary for plot data
plot_dict = {}

# Empty TCP client
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)


def encode_valriable(global_id, specifier, register_index, data):
    """
    Encodes the desired data compatible to ICANT communication protocol

    Parameters
    ----------
    global_id : int
        Global ID of the desired board.
    specifier : int
        Specifier for the desired variable.
    register_index : int
        Variable index of the desired variable.
    data : int or float
        Data, either int or float.

    Returns
    -------
    bytes
        The bytes to send to the ICANT.

    """
    datatype = holy_dict[str(
        global_id)]["VariableDefs"][register_index]["Datatype"]
    encoding_string = ''
    casted_data = 0
    if datatype == "eUint32":
        encoding_string = '<BBBL'
        casted_data = int(data)
    if datatype == "eInt32":
        encoding_string = '<BBBl'
        casted_data = int(data)
    if datatype == "eFloat":
        encoding_string = '<BBBf'
        casted_data = float(data)
    return struct.pack(encoding_string, global_id, specifier, register_index, casted_data)


def decode_id_specifier(data):
    """
    Decodes the global ID and specifier

    Parameters
    ----------
    data : bytes
        Received data buffer.

    Returns
    -------
    bytes
        Data buffer.
    list
        List of decoded arguments.

    """
    return data[2:], list(struct.unpack('<BB', data[0:2]))


def decode_variable_update(data):
    """
    Decodes the variable index and value

    Parameters
    ----------
    data : bytes
        Received data buffer.

    Returns
    -------
    bytes
        Data buffer.
    list
        List of decoded arguments.

    """
    return data[5:], list(struct.unpack('<BI', data[0:5]))


def decode_num_of_variables(data):
    """
    Decodes number of variables

    Parameters
    ----------
    data : bytes
        Received data buffer.

    Returns
    -------
    bytes
        Data buffer.
    list
        List of decoded arguments.

    """
    return data[1:], list(struct.unpack('<B', data[0:1]))


def decode_board_configuration(data):
    """
    Decodes SW-version, HW-version, name and description

    Parameters
    ----------
    data : bytes
        Received data buffer.

    Returns
    -------
    bytes
        Data buffer.
    list
        List of decoded arguments.

    """
    return data[64:], list(struct.unpack('<4s4s16s40s', data[0:64]))


def decode_variable_adding(data):
    """
    Decodes Value, minimal value, maximal value, startup value, safety value, cyclic update time, datatype, permission, register index, unit, namea and description

    Parameters
    ----------
    data : bytes
        Received data buffer.

    Returns
    -------
    bytes
        Data buffer.
    list
        List of decoded arguments.

    """
    return data[128:], list(struct.unpack('<IIIIIIBBB5s16s80s', data[0:128]))


def get_global_id(name):
    """
    Returns global ID from board name

    Parameters
    ----------
    name : str
        Board name.

    Returns
    -------
    int
        global ID of desired board, None if not found.

    """
    for global_id in holy_dict:
        if holy_dict[global_id]["BoardConfig"]["Name"] == name:
            return int(global_id)
    return None


def get_variable_index(global_id, variable_name):
    """
    Returns variable index from global ID and variable name

    Parameters
    ----------
    global_id : int
        Global ID of desired board.
    variable_name : str
        Name of variable.

    Returns
    -------
    int
        variable index, None if not found.

    """
    for varDef in holy_dict[str(global_id)]["VariableDefs"]:
        if varDef["Name"] == variable_name:
            return varDef["register_index"]
    return None


def decode_all(data_buffer, new_board_callback):
    """
    Decodes data buffer and depending on message type encoding different payloads

    Parameters
    ----------
    data_buffer : bytes
        Data buffer from ICANT.
    new_board_callback : function
        Callback to execute when new board is added.

    Returns
    -------
    bytes
        Rest of data buffer.
    dict
        Dictionary with global ID, message type and target register type.
    dict
        Data payload, depending on message type.

    """
    with holy_dict_lock:
        original_data_buffer = copy.copy(data_buffer)

        data_buffer, [global_id, specifier] = decode_id_specifier(data_buffer)

        specifier_dict = {"globalID": global_id,
                          "MessageType": "", "TargetRegisterType": ""}

        message_type_index = ((specifier & 0x18) >> 3)

        message_type_list = ["variableUpdate",
                             "boardConfiguration", "variableAdding", "numOfVariables"]
        specifier_dict["MessageType"] = message_type_list[message_type_index]

        target_register_type_index = (specifier & 0x07)
        target_register_type_list = [
            "Value", "MinValue", "MaxValue", "StartupValue", "SafetyValue", "CyclicUpdateTime"]
        specifier_dict["TargetRegisterType"] = target_register_type_list[target_register_type_index]

        if specifier_dict["MessageType"] == "variableUpdate":
            if len(data_buffer) < 5:
                return original_data_buffer, "NotEnoughBytes", "NotEnoughBytes"

            data_buffer, [variableIndex,
                          value] = decode_variable_update(data_buffer)

            if (len(holy_dict[str(specifier_dict["globalID"])]["VariableDefs"]) != holy_dict[str(specifier_dict["globalID"])]["NumOfVariables"]):
                return data_buffer, "VarUpdateEarly", "VarUpdateEarly"

            datatype = holy_dict[str(specifier_dict["globalID"])
                                 ]["VariableDefs"][variableIndex]["Datatype"]
            if datatype == "eInt32":
                value = struct.unpack('!i', struct.pack('!I', value))[0]
            elif datatype == "eUint32":
                value = value
            elif datatype == "eFloat":
                value = struct.unpack('!f', struct.pack('!I', value))[0]

            holy_dict[str(specifier_dict["globalID"])
                      ]["VariableDefs"][variableIndex]["Value"] = value

            return_data_dict = {"variableIndex": variableIndex, "Value": value}

        elif specifier_dict["MessageType"] == "numOfVariables":
            if len(data_buffer) < 1:
                return original_data_buffer, "NotEnoughBytes", "NotEnoughBytes"

            data_buffer, [num_of_variables] = decode_num_of_variables(data_buffer)
            holy_dict[str(specifier_dict["globalID"])
                      ]["NumOfVariables"] = num_of_variables

            return_data_dict = {"NumOfVariables": num_of_variables}

        elif specifier_dict["MessageType"] == "boardConfiguration":
            if len(data_buffer) < 64:
                return original_data_buffer, "NotEnoughBytes", "NotEnoughBytes"
            data_buffer, [sw_version, hw_version, name,
                          description] = decode_board_configuration(data_buffer)
            name = name.decode('utf-8').rstrip('\x00')
            hw_version = hw_version.decode('utf-8').rstrip('\x00')
            sw_version = sw_version.decode('utf-8').rstrip('\x00')
            description = description.decode('utf-8').rstrip('\x00')
            return_data_dict = {"hwVersion": hw_version,
                                "swVersion": sw_version, "Description": description, "Name": name}

            indexString = str(specifier_dict["globalID"])
            holy_dict.update({indexString: {
                             "BoardConfig": return_data_dict, "VariableDefs": [], "NumOfVariables": -1}})

        elif specifier_dict["MessageType"] == "variableAdding":
            if len(data_buffer) < 128:
                return original_data_buffer, "NotEnoughBytes", "NotEnoughBytes"
            data_buffer, [value, minValue, maxValue, startupValue, safetyValue, cyclicUpdateTime, datatype,
                          permission, register_index, unit, name, description] = decode_variable_adding(data_buffer)
            name = name.decode('utf-8').rstrip('\x00')
            unit = unit.decode('utf-8').rstrip('\x00')
            description = description.decode('utf-8').rstrip('\x00')

            if datatype == 0:
                value = struct.unpack('!i', struct.pack('!I', value))[0]
            elif datatype == 1:
                value = value
            elif datatype == 2:
                value = struct.unpack('!f', struct.pack('!I', value))[0]

            return_data_dict = {"Value": startupValue, "MinValue": minValue, "MaxValue": maxValue, "StartupValue": startupValue, "SafetyValue": safetyValue,
                                "CyclicUpdateTime": cyclicUpdateTime, "Datatype": "", "Permission": "", "register_index": register_index, "Unit": unit, "Name": name, "Description": description}
            if datatype == 0:
                return_data_dict["Datatype"] = "eInt32"
            elif datatype == 1:
                return_data_dict["Datatype"] = "eUint32"
            elif datatype == 2:
                return_data_dict["Datatype"] = "eFloat"
            if permission == 0:
                return_data_dict["Permission"] = "eRead"
            elif permission == 1:
                return_data_dict["Permission"] = "eReadWrite"

            holy_dict[str(specifier_dict["globalID"])
                      ]["VariableDefs"].append(return_data_dict)

            if (len(holy_dict[str(specifier_dict["globalID"])]["VariableDefs"]) == holy_dict[str(specifier_dict["globalID"])]["NumOfVariables"]):
                brd = holy_dict[str(specifier_dict["globalID"])]
                new_board_dict = {
                    "Name": brd["BoardConfig"]["Name"], "Variables": []}
                plot_dict.update({str(specifier_dict["globalID"]): {"Name": brd["BoardConfig"]["Name"], "Variables": []}})
                for var in brd["VariableDefs"]:
                    new_board_dict["Variables"].append(
                        {"Name": var["Name"], "Unit": var["Unit"], "Value": var["Value"], "Permission": var["Permission"]})
                    plot_dict[str(specifier_dict["globalID"])]["Variables"].append({"Name": var["Name"], "Active": False, "ValueList": []})
                
                new_board_callback(new_board_dict)
                


        return data_buffer, specifier_dict, return_data_dict


def get_all_board_configs():
    """
    Returns list of dictionaries of board information

    Returns
    -------
    list_of_dicts : list
        List of dictionaries of board information.

    """
    with holy_dict_lock:
        list_of_dicts = []
        for global_id in holy_dict:
            board = holy_dict[global_id]
            if (len(board["VariableDefs"]) == board["NumOfVariables"]):
                new_board_dict = {
                    "Name": board["BoardConfig"]["Name"], "Variables": []}
                for variable in board["VariableDefs"]:
                    new_board_dict["Variables"].append(
                        {"Name": variable["Name"], "Unit": variable["Unit"], "Value": variable["Value"], "Permission": variable["Permission"]})
                list_of_dicts.append(new_board_dict)
        return list_of_dicts


def connect_icant(server_ip, server_port):
    """
    Connects the TCP stream to ICANT

    Parameters
    ----------
    server_ip : str
        String of IPv4 address.
    server_port : int
        Server port.

    Returns
    -------
    None.

    """
    client.connect((server_ip, server_port))
    time.sleep(0.1)


def handle_received_data(msg):
    """
    Handles the data received by the website and sends it to ICANT

    Parameters
    ----------
    msg : str / dict
        JSON string or dictionary of board name, variable name and value.

    Returns
    -------
    None.

    """
    with holy_dict_lock:
        if isinstance(msg, str):
            data = json.loads(msg)
        else:
            data = msg
        global_id = get_global_id(data["Boardname"])
        
        if global_id == None:
            return
        
        register_index = get_variable_index(global_id, data["Variablename"])
        
        if "Plotstate" in data:
            with plot_dict_lock:
                if data["Plotstate"] == "Start":
                    plot_dict[str(global_id)]["Variables"][register_index]["Active"] = True
                elif data["Plotstate"] == "Stop":
                    plot_dict[str(global_id)]["Variables"][register_index]["Active"] = False
                elif data["Plotstate"] == "Reset":
                    plot_dict[str(global_id)]["Variables"][register_index]["ValueList"] = []
        else:
            specifier = 0
            value = data["Value"]
            holy_dict[str(global_id)]["VariableDefs"][register_index]["Value"] = value
            txData = encode_valriable(global_id, specifier, register_index, value)
            client.sendall(txData)
        
def get_plot_data():
    """
    Returns list of dictionaries of plot data, if plot data collected

    Returns
    -------
    list_of_plot_data : list
        List of dictionaries of plot data.

    """
    with plot_dict_lock:
        list_of_plot_data = []
        for board in plot_dict:
            for variable in plot_dict[board]["Variables"]:
                if len(variable["ValueList"]) > 0:
                    list_of_plot_data.append({"Boardname": plot_dict[board]["Name"], "Variablename": variable["Name"], "Valuelist": variable["ValueList"], "PlotState": variable["Active"]})
        
        return list_of_plot_data

def wecant_receive_thread(new_board_callback, new_value_callback):
    """
    Thread to receive data from ICANT and call the decode_all function

    Parameters
    ----------
    new_board_callback : function
        Function to call when new board is added.
    new_value_callback : function
        Function to call when new variable value is present.

    Returns
    -------
    None.

    """
    data_buffer = bytes()
    while True:
        data_buffer += client.recv(1024)
        while len(data_buffer) >= 3:
            data_buffer, specifier, decoded_data = decode_all(
                data_buffer, new_board_callback)
            if specifier == "VarUpdateEarly":
                pass
            elif specifier == "NotEnoughBytes":
                break
            else:
                if specifier["MessageType"] == "variableUpdate":
                    with holy_dict_lock:
                        board = holy_dict[str(specifier["globalID"])]
                        board_name = board["BoardConfig"]["Name"]
                        variable_name = board["VariableDefs"][decoded_data["variableIndex"]]["Name"]
                        value = decoded_data["Value"]

                        board["VariableDefs"][decoded_data["variableIndex"]
                                              ]["Value"] = value

                        data = {"Boardname": board_name,
                                "Variablename": variable_name, "Value": value}
                        
                        with plot_dict_lock:
                            if plot_dict[str(specifier["globalID"])]["Variables"][decoded_data["variableIndex"]]["Active"] == True:
                                plot_dict[str(specifier["globalID"])]["Variables"][decoded_data["variableIndex"]]["ValueList"].append(value)
                                                                              
                    
                    new_value_callback(data)
