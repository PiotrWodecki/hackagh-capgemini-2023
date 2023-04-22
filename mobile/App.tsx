import React, { useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import * as Location from "expo-location";
import useWebSocket from "react-native-use-websocket";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Progress from "react-native-progress";
import Slider from "@react-native-community/slider";
import { FontAwesome, Entypo, FontAwesome5 } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { transform } from "typescript";

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
        temp: number;
      };
    }
  | {
      type: "SPEED";
      payload: { speed: number };
    }
  | {
      type: "CHARGING_STATE";
      payload: { charging: boolean };
    }
  | {
      type: "COORDS_CAR";
      payload: { latitude: number; longitude: number };
    };

type ServerData = {
  battery: null | number;
  temperature: null | number;
  speed: null | number;
  charging: null | boolean;
  coords: null | { latitude: number; longitude: number };
  initRequest(): void;
};

function useServerData(): ServerData {
  const socketUrl = "ws://hackagh4.loca.lt/ws";
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(socketUrl, {
    onOpen: () => {
      console.log("connected");
      sendJsonMessage({ type: "INIT_REQUEST_APP" });
    },
    onError: (ev) => console.error("WS error: ", ev.message),
    shouldReconnect: (closeEvent) => true,
  });

  const [state, setState] = useState<ServerData>({
    battery: null,
    speed: null,
    temperature: null,
    charging: null,
    coords: null,
    initRequest: () => {
      sendJsonMessage({ type: "INIT_REQUEST_APP" });
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
          temperature: message.payload.temp,
        }));
      } else if (message.type === "CHARGING_STATE") {
        setState((state) => ({
          ...state,
          charging: message.payload.charging,
        }));
      } else if (message.type === "COORDS_CAR") {
        setState((state) => ({
          ...state,
          coords: message.payload,
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

function timePicker() {
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Monday",
  ];

  const defaultTime = new Date(2000, 1, 1, 8, 0);
  const [times, setTimes] = useState([
    defaultTime,
    defaultTime,
    defaultTime,
    defaultTime,
    defaultTime,
    defaultTime,
    defaultTime,
  ]);

  const [showPickerForDay, setShowPickerForDay] = useState<null | number>(null);

  const onChange = (event: any, selectedDate: Date) => {
    setTimes((times) => {
      times[showPickerForDay] = selectedDate;
      return times;
    });
    setShowPickerForDay(null);
  };

  return (
    <View
      style={{
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        display: "flex",
      }}
    >
      <FlatList
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          gap: 10,
        }}
        data={times}
        renderItem={({ item, index }) => {
          return (
            <View
              style={{
                flexDirection: "row",
                gap: 20,
                backgroundColor: "#e4e4e4",
                borderRadius: 5,
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 30, width: 200 }}>
                {dayNames[index]}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "#f5d21f",
                  borderRadius: 5,
                  paddingHorizontal: 5,
                }}
                onPress={() => setShowPickerForDay(index)}
              >
                <Text style={{ fontSize: 30 }}>
                  {item.toLocaleTimeString().slice(0, 5)}
                </Text>
              </TouchableOpacity>
              {showPickerForDay === index && (
                <DateTimePicker mode="time" value={item} onChange={onChange} />
              )}
            </View>
          );
        }}
      ></FlatList>
    </View>
  );
}

function mapView(carCoords: null | { latitude: number; longitude: number }) {
  const [status, requestPermission] = Location.useForegroundPermissions();
  const mapRef = useRef<MapView>();

  React.useEffect(() => {
    (async () => {
      await requestPermission();
      const pos = await Location.getLastKnownPositionAsync();

      const coords: { latitude: number; longitude: number }[] = [pos.coords];
      if (carCoords) {
        coords.push(carCoords);
      }

      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { bottom: 20, left: 20, right: 20, top: 20 },
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
      >
        {carCoords && <Marker coordinate={carCoords}></Marker>}
      </MapView>
    </View>
  );
}

export default function App() {
  const { battery, temperature, coords, initRequest } = useServerData();

  const showWarning = (warning) => {
    Toast.show({
      type: "error",
      text1: "Warning!",
      text2: warning,
    });
  };

  const [adjusting, setAdjusting] = useState<null | number>(null);
  console.log(adjusting);

  const temperatureAdjustment = (
    <View
      style={{
        flexDirection: "row",
        borderTopColor: "white",
        borderTopWidth: 1,
      }}
    >
      <TouchableOpacity
        style={{
          flex: 1.5,
          backgroundColor: "#E4E4E4",
          borderBottomLeftRadius: 20,
          padding: 15,
          display: "flex",
          alignItems: "center",
        }}
        activeOpacity={0.5}
      >
        <Text style={{ fontSize: 25, color: "#555555" }}>-</Text>
      </TouchableOpacity>
      <View
        style={{
          flex: 3,
          backgroundColor: "#E4E4E4",
          padding: 15,
          display: "flex",
          alignItems: "center",
          borderRightColor: "white",
          borderRightWidth: 2,
          borderLeftColor: "white",
          borderLeftWidth: 2,
        }}
      >
        <Text style={{ fontSize: 25, color: "#555555" }}>
          {adjusting ?? "?"}°C
        </Text>
      </View>
      <TouchableOpacity
        style={{
          flex: 1.5,
          backgroundColor: "#E4E4E4",
          borderBottomRightRadius: 20,
          padding: 15,
          display: "flex",
          alignItems: "center",
        }}
        activeOpacity={0.5}
      >
        <Text style={{ fontSize: 25, color: "#555555" }}>+</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>


      <TouchableOpacity onPress={() => showWarning("abc")}>
        <Image
          source={require("./assets/autko1.png")}
          style={styles.teslaImage}
        />
      </TouchableOpacity>
      

      <View style={styles.statRow}>
        <View>
          <Entypo
            name="battery"
            color="#F5D21F"
            size={30}
            style={{ transform: [{ rotate: "270deg" }], marginBottom: 2 }}
          />
          <Text style={styles.batteryText}>{battery * 100}%</Text>
        </View>

        <Progress.Bar
          progress={battery}
          borderRadius={20}
          height={60}
          width={250}
          color="#F5D21F"
        />
      </View>


      <TouchableOpacity style={{ width: "100%", alignItems: "center", backgroundColor: "#5FCCA6", padding: 15, borderRadius: 20 }}>
        <Text style={{ fontSize: 25, color:"white"}}>
          <FontAwesome5
            name="calendar-alt"
            size={25}
            color="white"

          /> Schedule
        </Text>
      </TouchableOpacity>

      <View style={{ width: "100%" }}>
        <View
          style={{
            flexDirection: "row",
          }}
        >
          <View
            style={{
              flex: 1.2,
              backgroundColor: "#489F81",
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: adjusting ? 0 : 20,
              padding: 15,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 25, color: "white" }}>
              {temperature ?? "?"}°C
            </Text>
          </View>
          <TouchableOpacity
            style={{
              flex: 3,
              backgroundColor: "#5FCCA6",
              borderTopRightRadius: 20,
              borderBottomRightRadius: adjusting ? 0 : 20,
              padding: 15,
              display: "flex",
              alignItems: "center",
            }}
            activeOpacity={0.5}
            onPress={() => {
              setAdjusting((adj) => (adj ? null : temperature));
            }}
          >
            <Text style={{ fontSize: 25, color: "white" }}>
              <FontAwesome name="thermometer-3" size={25} />
              {"  Adjust "}
              {adjusting ? "On" : "Off"}
            </Text>
          </TouchableOpacity>
        </View>
        {adjusting ? temperatureAdjustment : null}
      </View>
      <TouchableOpacity style={{ width: "100%", alignItems: "center", backgroundColor: "#5FCCA6", padding: 10, borderRadius: 20}}>
        <FontAwesome5 
          name="map-marked-alt"
          size={40}
          color="white"
        />
      </TouchableOpacity>
      <Toast position="top" bottomOffset={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: "15%",
    gap: 20,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    margin: 3,
    padding: 3,
  },
  batteryText: {
    color: "#F5D21F",
    fontSize: 20,
    margin: 5,
  },
  teslaImage: {
    width: 450,
    height: 250,
    margin: 30,
    marginTop: 65,
  },
  temperatureContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    alignContent: "center",
    justifyContent: "center",
    margin: 10,
    padding: 18,
    borderRadius: 100,
  },
});
