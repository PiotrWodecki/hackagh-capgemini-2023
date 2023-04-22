import React, { createContext, useContext, useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import useWebSocket from "react-native-use-websocket";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Progress from "react-native-progress";
import Slider from "@react-native-community/slider";
import { FontAwesome, Entypo, FontAwesome5 } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { transform } from "typescript";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import haversineDistance from 'haversine-distance';

const Stack = createNativeStackNavigator();
const wsContext = createContext(null);

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
    type: "TEMPERATURE_TARGET";
    payload: { target: number };
  }
  | {
    type: "TEMPERATURE_STATE";
    payload: { state: boolean };
  }
  | { type: "SCHEDULE", payload: { schedule: string[] } }
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
  temperatureState: null | boolean;
  temperatureTarget: null | number;
  speed: null | number;
  charging: null | boolean;
  coords: null | { latitude: number; longitude: number };
  schedules: null | Date[];
  initRequest(): void;
  setTemperatureState(state: boolean): void;
  setTemperatureTarget(target: number): void;
  setSchedule(schedule: Date[]): void;
};

function useServerData(): ServerData {
  const socketUrl = "ws://hackagh5.loca.lt/ws";
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
    temperatureState: null,
    temperatureTarget: null,
    charging: null,
    coords: null,
    schedules: null,
    initRequest: () => {
      sendJsonMessage({ type: "INIT_REQUEST_APP" });
    },
    setTemperatureState: (state) => {
      console.log("set state");
      sendJsonMessage({
        type: "TEMPERATURE_STATE",
        payload: { state },
      });
    },
    setTemperatureTarget: (target) => {
      sendJsonMessage({
        type: "TEMPERATURE_SET",
        payload: { target },
      });
    },
    setSchedule: (schedule) => {
      sendJsonMessage({
        type: "SCHEDULE",
        payload: { schedule: schedule.map(d => d.toISOString()) }
      });
    }
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
      } else if (message.type === "TEMPERATURE_TARGET") {
        setState((state) => ({
          ...state,
          temperatureTarget: message.payload.target,
        }));
      } else if (message.type === "TEMPERATURE_STATE") {
        setState((state) => ({
          ...state,
          temperatureState: message.payload.state,
        }));
      } else if (message.type === "SCHEDULE") {
        setState((state) => ({
          ...state,
          schedules: message.payload.schedule.map(s => new Date(s)),
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


function useRollbackValue(value, serverSetFunction) {
  const [state, setState] = useState(value);

  React.useEffect(() => {
    if (state === null && value !== null) {
      setState(value);
    }
  }, [value]);

  const vars = useRef({
    timeout: null,
  });


  return [
    state,
    (newValue) => {
      setState(newValue);
      if (vars.current.timeout) {
        clearTimeout(vars.current.timeout);
        vars.current.timeout = null;
      }
      vars.current.timeout = setTimeout(() => {
        serverSetFunction(newValue);
      }, 1000);
    },
  ];
}


function TimePicker({ route }) {
  const { schedules, setSchedule }: ServerData = useContext(wsContext);

  const [schedulesR, setScheduleR] = useRollbackValue(schedules, setSchedule);

  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Monday",
  ];

  const [showPickerForDay, setShowPickerForDay] = useState<null | number>(null);

  const onChange = (index) => (event: any, selectedDate: Date) => {
    const newSchedule = [...schedulesR];
    newSchedule[index] = selectedDate;
    setScheduleR(newSchedule);
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
        data={schedulesR}
        renderItem={({ item, index }) => {
          return (
            <View
              style={{
                flexDirection: "row",
                gap: 20,
                backgroundColor: "#489F81",
                borderRadius: 25,
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 30, width: 200, marginLeft: 10, color: "white" }}>
                {dayNames[index]}
              </Text>
              {Platform.OS === "android" ??
                <TouchableOpacity
                  style={{
                    backgroundColor: "#5FCCA6",
                    borderRadius: 15,
                    paddingHorizontal: 5,
                  }}
                  onPress={() => setShowPickerForDay(index)}
                >
                  <Text style={{ fontSize: 30, color: "white" }}>
                    {item.toLocaleTimeString().slice(0, 5)}
                  </Text>
                </TouchableOpacity>
              }
              {(showPickerForDay === index || Platform.OS === "ios") && (
                <DateTimePicker themeVariant="dark" textColor="white" mode="time" value={item} onChange={onChange(index)} />
              )}
            </View>
          );
        }}
      ></FlatList>
    </View>
  );
}

function OurMapView({ route, navigation }) {
  const carCoords: null | { latitude: number; longitude: number } = route.params;
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

function App({ route, navigation }) {
  const {
    battery,
    charging,
    temperature,
    temperatureState,
    temperatureTarget,
    coords,
    speed,
    setTemperatureTarget,
    setTemperatureState,
  }: ServerData = useContext(wsContext);

  const [temperatureStateR, setTemperatureStateR] = useRollbackValue(
    temperatureState,
    setTemperatureState
  );

  const [temperatureTargetR, setTemperatureTargetR] = useRollbackValue(
    temperatureTarget,
    setTemperatureTarget
  );

  const [status, requestPermission] = Location.useForegroundPermissions();
  useEffect(() => {
    (async () => {
      await requestPermission();
      if (coords.latitude !== 0 && coords.longitude !== 0) {
        const pos = await Location.getLastKnownPositionAsync();
        const makeDumb = val => ({ lat: val.latitude, lon: val.longitude });
        const distance = haversineDistance(makeDumb(pos.coords), makeDumb(coords));
        if (distance > 50 && speed > 10) {
          Toast.show({
            type: "error",
            text1: "Your car is leaving!",
          });
        }
      }
    })();
  }, [coords, speed])

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
        onPress={() => {
          if (temperatureTargetR && setTemperatureTargetR) {
            setTemperatureTargetR(temperatureTargetR - 1);
          }
        }}
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
          {temperatureTargetR ?? "?"}°C
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
        onPress={() => {
          if (temperatureTargetR && setTemperatureTargetR) {
            setTemperatureTargetR(temperatureTargetR + 1);
          }
        }}
      >
        <Text style={{ fontSize: 25, color: "#555555" }}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const chargingText = (
    <>
      <Text
        style={{
          position: "absolute",
          alignSelf: "center",
          top: "15%",
          fontSize: 20,
          textShadowColor: "#F5D21F",
          textShadowRadius: 1,
          textShadowOffset: { height: 1, width: 1 },
          padding: 1,
        }}
      >
        Charging...
      </Text>
      <Text
        style={{
          position: "absolute",
          alignSelf: "center",
          top: "15%",
          fontSize: 20,
          textShadowColor: "#F5D21F",
          textShadowRadius: 1,
          textShadowOffset: { height: -1, width: 1 },
          padding: 1,
        }}
      >
        Charging...
      </Text>
      <Text
        style={{
          position: "absolute",
          alignSelf: "center",
          top: "15%",
          fontSize: 20,
          textShadowColor: "#F5D21F",
          textShadowRadius: 1,
          textShadowOffset: { height: 1, width: -1 },
          padding: 1,
        }}
      >
        Charging...
      </Text>
      <Text
        style={{
          position: "absolute",
          alignSelf: "center",
          top: "15%",
          fontSize: 20,
          textShadowColor: "#F5D21F",
          textShadowRadius: 1,
          textShadowOffset: { height: -1, width: -1 },
          padding: 1,
        }}
      >
        Charging...
      </Text>
      <Text
        style={{
          color: "white",
          position: "absolute",
          alignSelf: "center",
          top: "15%",
          fontSize: 20,
        }}
      >
        Charging...
      </Text>
    </>
  );

  return (
    <View style={styles.container}>


      <TouchableOpacity>
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
        >
          {charging ? chargingText : null}
        </Progress.Bar>
      </View>


      <TouchableOpacity style={{ width: "100%", alignItems: "center", backgroundColor: "#5FCCA6", padding: 15, borderRadius: 20 }}
        onPress={() => navigation.navigate("schedule")}>
        <Text style={{ fontSize: 25, color: "white" }}>
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
              padding: 15,
              display: "flex",
              alignItems: "center",
            }}
            activeOpacity={0.5}
            onPress={() => {
              if (temperatureStateR !== null && setTemperatureStateR) {
                setTemperatureStateR(!temperatureStateR);
              }
            }}
          >
            <Text style={{ fontSize: 25, color: "white" }}>
              <FontAwesome name="thermometer-3" size={25} />
              {"  Adjust "}
              {temperatureStateR ? "On" : "Off"}
            </Text>
          </TouchableOpacity>
        </View>
        {temperatureAdjustment}
      </View>
      <TouchableOpacity
        style={{ width: "100%", alignItems: "center", backgroundColor: "#5FCCA6", padding: 10, borderRadius: 20 }}
        onPress={() => navigation.navigate("map", coords)}>
        <FontAwesome5
          name="map-marked-alt"
          size={40}
          color="white"
        />
      </TouchableOpacity>
      <Toast position="top" bottomOffset={20} />
    </View >
  );
}

export default function RootApp() {
  const data = useServerData();

  return <wsContext.Provider value={data}>
    <NavigationContainer>
      <Stack.Navigator >
        <Stack.Screen name="home" component={App} options={{ header: () => null }} />
        <Stack.Screen name="map" component={OurMapView} />
        <Stack.Screen name="schedule" component={TimePicker} />
      </Stack.Navigator>
    </NavigationContainer>
  </wsContext.Provider>
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
