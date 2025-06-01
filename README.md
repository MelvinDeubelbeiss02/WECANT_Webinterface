# WECANT_Webinterface
Webinterface for WECANT System of FHNW Rover

## Abstract
Unsere Applikation ist ein Webinterface für das Sensor/Aktor-Netzwerk *WECANT* (Wired Ethernet Can Adaptive Network Topology) des FHNW Rovers. Der Server, programmiert in Python, kommuniziert mti dem *ICANT* (Interface Controller for Adaptive Network Topology) über ein TCP-Stream und beinhaltet ein Webserver mit Flask. Die Client-Server Verbindung besteht aus einem WebSocket, wobei der Client die verschiedenen Boards, verbunden am ICANT, in der Weboberfläche darstellt und bidirektional kommunizieren kann.

## Funktionsweise der Applikation

## Serverseitige API Endpoints

## Beschreibung Source Code und funktionsweise des Clients

## Inbetriebnahme
### Module installieren
Falls noch nicht vorhanden muss flask und flask-socketio installiert werden. Die folgende Zeile bezieht sich auf Systeme, welche pip verwenden. 
```bash
pip install flask flask-socketio
```

### Hardware verbinden
Das ICANT muss mit +5V (mindestens 3A Strombegrenzung) gespiesen werden. Es muss eine Ethernet-Verbindung (100MBit) zum Server hergestellt werden. Dabei muss der Server im selben Subnetz wie das ICANT liegen, welches 172.16.10.0/24 ist. Dabei muss beachtet werden, dass das ICANT die IP 172.16.10.82 besitzt und diese somit nicht nochmals vergeben werden darf. Anschliessend können beliebige WECANT-Boards mit den zugehörigen Kabel an das ICANT verbunden werden.

### Server starten
Nun kann das Python Script *wecantServer.py* gestartet werden:
```bash
python wecantServer.py
```

### Mit Website verbinden
Falls lokal auf den Server zugegriffen werden soll, kann die Website durch [diesen Link](http://localhost:5000/) aufgerufen werden. Bei externem Server kann die Website auf dem Port 5000 aufgerufen werden. Dies wird beim Raspberry Pi mit Hostname WecantInterface durch [diesen Link](http://wecantwebinterface.local:5000/) gemacht.
