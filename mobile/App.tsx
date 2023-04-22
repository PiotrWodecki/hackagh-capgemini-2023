import React from "react";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import useWebSocket from "react-native-use-websocket";

type BatteryServerMessage = {
  type: "BATTERY";
  payload: {
    percent: number;
  };
};

type ServerMessage = BatteryServerMessage;

type ServerData = {
  battery: null | number;
  initRequest();
};

function useServerData(): ServerData {
  const socketUrl = "ws://hackagh4.loca.lt/ws";
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(socketUrl, {
    onOpen: () => sendJsonMessage({ type: "INIT_REQUEST" }),
    onError: (ev) => console.error(ev.message),
    shouldReconnect: (closeEvent) => true,
  });

  const [battery, setBattery] = useState<null | number>(null);

  useEffect(() => {
    if (lastJsonMessage) {
      const message = lastJsonMessage as ServerMessage;
      if (message.type === "BATTERY") {
        setBattery(message.payload.percent);
      } else if (Object.keys(message).length != 0) {
        console.log("Unhandled message: ", message);
      }
    } else {
      console.log("Got non json");
    }
  }, [lastJsonMessage]);

  const initRequest = () => {
    sendJsonMessage({ type: "INIT_REQUEST" });
  };

  return { battery, initRequest };
}

export default function App() {
  const { battery, initRequest } = useServerData();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={initRequest}>
        <Text>Hello</Text>
      </TouchableOpacity>
      <Text>Battery: {battery}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
