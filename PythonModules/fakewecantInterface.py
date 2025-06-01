import struct
import copy
import socket
import time
import json

holy_dict = {}
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

def encode_valriable(globalID, specifier, registerIndex, data):
    print(holy_dict[str(globalID)]["VariableDefs"][registerIndex])
    if holy_dict[str(globalID)]["VariableDefs"][registerIndex]["Datatype"] == "eUint32":
        return struct.pack('<BBBL', globalID, specifier, registerIndex, data)
    if holy_dict[str(globalID)]["VariableDefs"][registerIndex]["Datatype"] == "eInt32":
        return struct.pack('<BBBl', globalID, specifier, registerIndex, data)
    if holy_dict[str(globalID)]["VariableDefs"][registerIndex]["Datatype"] == "eFloat":
        return struct.pack('<BBBf', globalID, specifier, registerIndex, data)

def decode_id_specifier(data):
    return data[2:], list(struct.unpack('<BB', data[0:2]))

def decode_variable_update(data):
    return data[5:], list(struct.unpack('<BI', data[0:5]))

def decode_num_of_variables(data):
    return data[1:], list(struct.unpack('<B', data[0:1]))

def decode_board_configuration(data):
    return data[64:], list(struct.unpack('<4s4s16s40s', data[0:64])) 

def decode_variable_adding(data):
    return data[128:], list(struct.unpack('<IIIIIIBBB5s16s80s', data[0:128]))

def getGlobalID(name):
    for globalID in holy_dict:
        if holy_dict[globalID]["BoardConfig"]["Name"] == name:
            return int(globalID)
    return "None"

def getVariableID(globalID, variablename):
    for varDef in holy_dict[str(globalID)]["VariableDefs"]:
        if varDef["Name"] == variablename:
            return varDef["RegisterIndex"]
    return "None"

def decode_all(response, new_board_callback):  # TODO, da callback für neue Daten übergeben
    original_response = copy.copy(response)

    response, [globalID, specifier] = decode_id_specifier(response)

    specifier_dict = {"globalID": globalID, "MessageType": "", "TargetRegisterType": ""}

    if (((specifier & 0x18) >> 3) == 0x00):
        specifier_dict["MessageType"] = "variableUpdate"
    elif (((specifier & 0x18) >> 3) == 0x01):
        specifier_dict["MessageType"] = "boardConfiguration"
    elif (((specifier & 0x18) >> 3) == 0x02):
        specifier_dict["MessageType"] = "variableAdding"
    elif (((specifier & 0x18) >> 3) == 0x03):
        specifier_dict["MessageType"] = "numOfVariables"

    if ((specifier & 0x07) == 0x00):
        specifier_dict["TargetRegisterType"] = "Value"
    elif ((specifier & 0x07) == 0x01):
        specifier_dict["TargetRegisterType"] = "MinValue"
    elif ((specifier & 0x07) == 0x02):
        specifier_dict["TargetRegisterType"] = "MaxValue"
    elif ((specifier & 0x07) == 0x03):
        specifier_dict["TargetRegisterType"] = "StartupValue"
    elif ((specifier & 0x07) == 0x04):
        specifier_dict["TargetRegisterType"] = "SafetyValue"
    elif ((specifier & 0x07) == 0x05):
        specifier_dict["TargetRegisterType"] = "CyclicUpdateTime"



    if specifier_dict["MessageType"] == "variableUpdate": # Variable update
        if len(response) < 5:
            return original_response, "NotEnoughBytes", "NotEnoughBytes"            

        response, [variableIndex, value] = decode_variable_update(response)

        if(len(holy_dict[str(specifier_dict["globalID"])]["VariableDefs"]) != holy_dict[str(specifier_dict["globalID"])]["NumOfVariables"]):
            return response, "VarUpdateEarly", "VarUpdateEarly"

        
        if holy_dict[str(specifier_dict["globalID"])]["VariableDefs"][variableIndex]["Datatype"] == "eInt32":
            value = struct.unpack('!i', struct.pack('!I', value))[0]
        elif holy_dict[str(specifier_dict["globalID"])]["VariableDefs"][variableIndex]["Datatype"] == "eUint32":
            value = value
        elif holy_dict[str(specifier_dict["globalID"])]["VariableDefs"][variableIndex]["Datatype"] == "eFloat":
            value = struct.unpack('!f', struct.pack('!I', value))[0]

        holy_dict[str(specifier_dict["globalID"])]["VariableDefs"][variableIndex]["Value"] = value

        return_data_dict = {"variableIndex": variableIndex, "Value": value}

    elif specifier_dict["MessageType"] == "numOfVariables": # Number of Variables
        if len(response) < 1:
            return original_response, "NotEnoughBytes", "NotEnoughBytes"

        response, [num_of_variables] = decode_num_of_variables(response)
        holy_dict[str(specifier_dict["globalID"])]["NumOfVariables"] = num_of_variables

        return_data_dict = {"NumOfVariables": num_of_variables}

    elif specifier_dict["MessageType"] == "boardConfiguration": # Board configuration
        if len(response) < 64:
            return original_response, "NotEnoughBytes", "NotEnoughBytes"
        response, [swVersion, hwVersion, name, description] = decode_board_configuration(response)
        name = name.decode('utf-8').rstrip('\x00')
        hwVersion = hwVersion.decode('utf-8').rstrip('\x00')
        swVersion = swVersion.decode('utf-8').rstrip('\x00')
        description = description.decode('utf-8').rstrip('\x00')
        return_data_dict = {"hwVersion": hwVersion, "swVersion": swVersion, "Description": description, "Name": name}

        indexString = str(specifier_dict["globalID"])
        holy_dict.update({indexString:{"BoardConfig": return_data_dict, "VariableDefs": [], "NumOfVariables": -1}})

    elif specifier_dict["MessageType"] == "variableAdding": # Variable adding
        if len(response) < 128:
            return original_response, "NotEnoughBytes", "NotEnoughBytes"
        response, [value, minValue, maxValue, startupValue, safetyValue, cyclicUpdateTime, datatype, permission, registerIndex, unit, name, description] = decode_variable_adding(response)
        name = name.decode('utf-8').rstrip('\x00')
        unit = unit.decode('utf-8').rstrip('\x00')
        description = description.decode('utf-8').rstrip('\x00')

        if datatype == 0:
            value = struct.unpack('!i', struct.pack('!I', value))[0]
        elif datatype == 1:
            value = value
        elif datatype == 2:
            value = struct.unpack('!f', struct.pack('!I', value))[0]


        return_data_dict = {"Value": value, "MinValue": minValue, "MaxValue": maxValue, "StartupValue": startupValue, "SafetyValue": safetyValue, "CyclicUpdateTime": cyclicUpdateTime, "Datatype": "", "Permission": "", "RegisterIndex": registerIndex, "Unit": unit, "Name": name, "Description": description}
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

        holy_dict[str(specifier_dict["globalID"])]["VariableDefs"].append(return_data_dict)

        if(len(holy_dict[str(specifier_dict["globalID"])]["VariableDefs"]) == holy_dict[str(specifier_dict["globalID"])]["NumOfVariables"]):
            new_board_callback("New Board!!")

    return response, specifier_dict, return_data_dict

def connectIcant(server_ip, server_port):
    print("Beginning to connect to ICANT (fake)")
    print("Connected to ICANT (fake)")
    time.sleep(0.1)
    
def handle_received_data(msg):
    data = json.loads(msg)
    print(f"Message received: {data}")

def wecantReceiveThread(new_board_callback, new_value_callback):
    print("WECANT Receive Thread started (fake)")
    counter = 0
    while True:
        time.sleep(2)
        print("Send new value callback (fake)")
        new_value_callback({'msg': 'New Variable Data'})
        
        counter += 1
        if counter % 5 == 0:
            print("Send new board callback (fake)")
            new_board_callback({'msg': "New Board Data"})
                    
