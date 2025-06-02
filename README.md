# WECANT_Webinterface
Webinterface for WECANT System of FHNW Rover

## Abstract
Unsere Applikation ist ein Webinterface für das Sensor/Aktor-Netzwerk *WECANT* (Wired Ethernet Can Adaptive Network Topology) des FHNW Rovers. Der Server, programmiert in Python, kommuniziert mti dem *ICANT* (Interface Controller for Adaptive Network Topology) über ein TCP-Stream und beinhaltet ein Webserver mit Flask. Die Client-Server Verbindung besteht aus einem WebSocket, wobei der Client die verschiedenen Boards, verbunden am ICANT, in der Weboberfläche darstellt und bidirektional kommunizieren kann.

## Funktionsweise der Applikation
Die Applikation besteht serverseitig aus einem Flask-Backend. Dieses verarbeitet HTTP-Anfragen und nutzt WebSocket-Verbindungen, um Sensordaten, die vom ICANT per TCP kommen, an den Client zu senden oder Benutzereingaben zu empfangen. Benutzereingaben, die vom Client stammen und für bestimmte Boards bestimmt sind, leitet der Server per TCP an das ICANT-Modul weiter. Das ICANT wiederum überträgt diese Daten über den CAN-Bus an die jeweiligen Boards. Dieser Aufbau ist in Abbildung xx dargestellt.

## Serverseitige API Endpoints
| Typ       | Endpoint / Event       | Beschreibung |
|-----------|------------------------|--------------|
| **HTTP**  | `/`                    | Liefert die Startseite `index.html`. |
| **HTTP**  | `/board/<board_name>`  | Liefert ein Template abhängig vom Typ des Boards. |
| **WebSocket** | `connect`          | Wird beim Aufbau einer neuen WebSocket-Verbindung ausgelöst. Sendet an den verbundenen Client:<br>• alle bekannten Board-Konfigurationen als `NewBoard`-Events<br>• alle gespeicherten Plot-Daten als `PlotData`-Events. |
| **WebSocket** | `message`          | Verarbeitet eingehende Nachrichten (meist JSON) mit Board-Name, Variablenname und Wert.<br>Leitet sie an `wecant.handle_received_data(msg)` weiter. |


## Beschreibung Source Code und funktionsweise des Clients
### Server
Der Server besteht aus zwei Python-Scripts. Das File [wecantServer.py](https://github.com/MelvinDeubelbeiss02/WECANT_Webinterface/blob/main/server/wecantServer.py) startet den die Verbindung zum ICANT und den Flask-Webserver. Zudem werden die HTTP und WebSocket Endpoints definiert und die nötigen Threads gestartet. Das File [wecantInterface.py](https://github.com/MelvinDeubelbeiss02/WECANT_Webinterface/blob/main/server/PythonModules/wecantInterface.py) beinhaltet alle Logik und Funktionen für die Kommunikation mit dem ICANT. Für genauere Informationen über den Server-Code können die Docstrings der Funktionen angeschaut werden.

### Client

## Inbetriebnahme
### Module installieren mit pip
Falls noch nicht vorhanden muss flask und flask-socketio installiert werden. Die folgende Zeile bezieht sich auf Systeme, welche pip verwenden. 
```bash
pip install flask flask-socketio
```
### Module installieren mit apt als Packet Manager
Beim Raspberry Pi 5 ist pip als Packet Manager nicht mehr erwünscht. Dadurch soll beim Raspberry Pi 5 mit einer virtuellen Python Umgebung gearbeitet werden, um keine Paket-Konflikte zu riskieren. Mit folgenden Codezeilen kann die virtuelle Python Umgebung installiert werden. Dabei muss beachtet werden, dass man in den Ordner navigiert, in welchem auch die source und client Ordner liegen.
```bash
sudo apt install python3-venv
python3 -m venv flaskenv
source flaskenv/bin/activate
pip install flask flask-socketio eventlet
```

### Hardware verbinden
Das ICANT muss mit +5V (mindestens 3A Strombegrenzung) gespiesen werden. Es muss eine Ethernet-Verbindung (100MBit) zum Server hergestellt werden. Dabei muss der Server im selben Subnetz wie das ICANT liegen, welches 172.16.10.0/24 ist. Dabei muss beachtet werden, dass das ICANT die IP 172.16.10.82 besitzt und diese somit nicht nochmals vergeben werden darf. Anschliessend können beliebige WECANT-Boards mit den zugehörigen Kabel an das ICANT verbunden werden.

### Server starten
Falls beim Raspberry Pi 5 mit der virtuellen Umgebung gearbeitet wird, dann muss zuerst noch die virtuelle Umgebung aktiviert werden.
```bash
source flaskenv/bin/activate
```
Nun kann das Python Script *wecantServer.py* gestartet werden:
```bash
python wecantServer.py
```


### Mit Website verbinden
Falls lokal auf den Server zugegriffen werden soll, kann die Website durch [diesen Link](http://localhost:5000/) aufgerufen werden. Bei externem Server kann die Website auf dem Port 5000 aufgerufen werden. Dies wird beim Raspberry Pi mit Hostname WecantInterface durch [diesen Link](http://wecantwebinterface.local:5000/) gemacht.
