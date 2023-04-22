import "./App.css";
import Car from "./components/Car";
import Controls from "./components/Controls";
import React, { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import Map from "./components/Map";

function App() {
  //-----setting up states------------
  const [realCoords, setRealCoords] = useState({ x: 50.069468, y: 19.91008 });

  const [isCharging, setIsCharging] = useState(false);
  const [battery, setBattery] = useState(80);
  const [speed, setSpeed] = useState(30);
  const [temperature, setTemperature] = useState(20);
  const [temperatureState, setTemperatureState] = useState(0);
  const [targetTemperature, setTargetTemperature] = useState(temperature);
  console.log(temperature, targetTemperature, temperatureState);
  //-----setting up websocket--------
  const socketUrl = "ws://hackagh4.loca.lt/ws";
  const [messageHistory, setMessageHistory] = useState([]);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    onOpen: () => sendMessage(JSON.stringify({ type: "INIT_REQUEST_CAR" })),
    onError: (ev) => console.error(ev.message),
    shouldReconnect: (closeEvent) => false,
  });
  console.log(messageHistory.length);
  const [intervalId, setIntervalId] = useState();
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      console.log(message);
      if (message.type === "CHARGING_STATE") {
        setIsCharging(message.payload.charging);
      } else if (message.type === "TEMPERATURE_SET") {
        setTargetTemperature(message.payload.temp);
      } else if (message.type === "TEMPERATURE_STATE") {
        console.log(message.payload.state);
        setTemperatureState(message.payload.state);
      }
    } else {
      console.log("Got no json");
    }
  }, [lastMessage]);

  useEffect(() => {
    if (temperatureState === 1) {
      if (targetTemperature > temperature) {
        // gradually increase the temperature
        const intrvlId = setInterval(() => {
          if (temperature < targetTemperature) {
            setTemperature(temperature + 1);
          } else {
            clearInterval(intervalId); // stop the interval once target temperature is reached
          }
        }, 1000); // change the interval time as needed
        setIntervalId(intrvlId);
      } else if (targetTemperature < temperature) {
        // gradually decrease the temperature
        const intrvlId = setInterval(() => {
          if (temperature > targetTemperature) {
            setTemperature(temperature - 1);
          } else {
            clearInterval(intervalId); // stop the interval once target temperature is reached
          }
        }, 3000); // change the interval time as needed
        setIntervalId(intrvlId);
      }
    } else {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [temperatureState, targetTemperature, temperature]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
    }
  }, [lastMessage]);

  //-----discharging mock--------------
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!isCharging && battery > 0) {
        setBattery((prev) => prev - 0.2);
      } else if (isCharging && battery < 100) {
        setBattery((prev) => (prev + 1 > 100 ? 100 : prev + 1));
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [battery, isCharging]);

  //-----sending battery level to server--------
  useEffect(() => {
    sendMessage(
      JSON.stringify({
        type: "BATTERY",
        payload: { percent: battery.toFixed(0) / 100 },
      })
    );
  }, [Math.round(battery), isCharging]);
  //-----sending speed to server----------------
  useEffect(() => {
    sendMessage(
      JSON.stringify({
        type: "SPEED",
        payload: { speed },
      })
    );
  }, [speed]);
  //-----sending temp to server-----------------
  useEffect(() => {
    sendMessage(
      JSON.stringify({
        type: "TEMPERATURE",
        payload: { temp: temperature },
      })
    );
  }, [temperature]);
  //-----sending coords to server-----------------
  useEffect(() => {
    sendMessage(
      JSON.stringify({
        type: "COORDS_CAR",
        payload: {
          latitude: realCoords.x,
          longitude: realCoords.y,
        },
      })
    );
  }, [realCoords.x, realCoords.y]);

  return (
    <div className="App">
      <span>The WebSocket is currently {connectionStatus}</span>
      {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
      {/* <ul>
        {messageHistory.map((message, idx) => (
          <span key={idx}>{message ? message.data : null}</span>
        ))}
      </ul> */}
      <div className="App-header">
        <h2>VroomVroom</h2>
        <div className="container">
          <Controls
            isCharging={isCharging}
            className="controls"
            battery={battery}
            speed={speed}
            setIsCharging={setIsCharging}
            setTemperature={setTemperature}
            setBattery={setBattery}
            setSpeed={setSpeed}
            temperature={temperature}
          />
          <Car isCharging={isCharging} />
          <Map realCoords={realCoords} setRealCoords={setRealCoords} />
        </div>
      </div>
    </div>
  );
}

export default App;
