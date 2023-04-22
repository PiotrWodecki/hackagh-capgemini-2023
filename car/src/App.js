import "./App.css";
import Car from "./controls/Car";
import Controls from "./controls/Controls";
import React, { useState, useEffect, useCallback } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

function App() {
  //-----setting up websocket--------
  const socketUrl = "ws://hackagh3.loca.lt/ws";
  const [messageHistory, setMessageHistory] = useState([]);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

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
  }, [lastMessage, setMessageHistory]);
  //---------------------------------

  //-----setting up states------------
  const [isCharging, setIsCharging] = useState(true);
  const [battery, setBattery] = useState(80);
  const [speed, setSpeed] = useState(30);
  const [proximity, setProximity] = useState(800);
  const [temperature, setTemperature] = useState(20);

  //-----discharging mock--------------
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!isCharging && battery > 0) {
        setBattery((prev) => prev - 0.2);
      } else if (isCharging && battery < 100) {
        setBattery((prev) => prev + 1);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [battery, isCharging]);
  //------------------------------------

  //-----sending battery level to server--------
  useEffect(() => {
    console.log("sending temp");
    sendMessage(
      JSON.stringify({
        type: "BATTERY",
        payload: { percent: battery.toFixed(0) },
      })
    );
  }, [Math.round(battery)]);
  //--------------------------------------------

  return (
    <div className="App">
      <span>The WebSocket is currently {connectionStatus}</span>
      {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
      <ul>
        {messageHistory.map((message, idx) => (
          <span key={idx}>{message ? message.data : null}</span>
        ))}
      </ul>
      <div className="App-header">
        <h2>Your cool car 🚗</h2>
        <div className="container">
          <Controls
            className="controls"
            battery={battery}
            speed={speed}
            proximity={proximity}
            setIsCharging={setIsCharging}
            setTemperature={setTemperature}
            setBattery={setBattery}
            setSpeed={setSpeed}
            setProximity={setProximity}
            temperature={temperature}
          />
          <Car isCharging={isCharging} />
        </div>
      </div>
    </div>
  );
}

export default App;
