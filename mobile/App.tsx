import React, { useRef } from "react";
import MapView from "react-native-maps";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import useWebSocket from "react-native-use-websocket";

type ServerMessage =
  | {
      type: "BATTERY";
      payload: {
        percent: number;
      };
    }
  | {
      type: "TEMPERATURE";
      payload: {
        celsius: number;
      };
    }
  | {
      type: "SPEED";
      payload: { speed: number };
    }
  | {
      type: "CHARGING_STATE";
      payload: { charging: boolean };
    };

type ServerData = {
  battery: null | number;
  temperature: null | number;
  speed: null | number;
  charging: null | boolean;
  initRequest(): void;
};

function useServerData(): ServerData {
  const socketUrl = "ws://hackagh4.loca.lt/ws";
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(socketUrl, {
    onOpen: () => {
      console.log("connected");
      sendJsonMessage({ type: "INIT_REQUEST" });
    },
    onError: (ev) => console.error("WS error: ", ev.message),
    shouldReconnect: (closeEvent) => true,
  });

  const [state, setState] = useState<ServerData>({
    battery: null,
    speed: null,
    temperature: null,
    charging: null,
    initRequest: () => {
      sendJsonMessage({ type: "INIT_REQUEST" });
    },
  });

  useEffect(() => {
    if (lastJsonMessage) {
      const message = lastJsonMessage as ServerMessage;
      if (message.type === "BATTERY") {
        setState((state) => ({
          ...state,
          battery: message.payload.percent,
        }));
      } else if (message.type === "SPEED") {
        setState((state) => ({
          ...state,
          speed: message.payload.speed,
        }));
      } else if (message.type === "TEMPERATURE") {
        setState((state) => ({
          ...state,
          temperature: message.payload.celsius,
        }));
      } else if (message.type === "CHARGING_STATE") {
        setState((state) => ({
          ...state,
          charging: message.payload.charging,
        }));
      } else if (Object.keys(message).length != 0) {
        console.log("Unhandled message: ", message);
      }
    } else {
      console.log("Got non json");
    }
  }, [lastJsonMessage]);

  return state;
}

function mapView() {
  const [status, requestPermission] = Location.useForegroundPermissions();
  const mapRef = useRef<MapView>();

  React.useEffect(() => {
    (async () => {
      await requestPermission();
      const pos = await Location.getLastKnownPositionAsync();
      mapRef.current.animateCamera({
        center: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        },
        zoom: 15,
      });
    })();
  }, []);

  return (
    <View>
      <MapView
        style={{ width: "100%", height: "100%" }}
        loadingEnabled={true}
        showsUserLocation={true}
        ref={mapRef}
      ></MapView>
    </View>
  );
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
