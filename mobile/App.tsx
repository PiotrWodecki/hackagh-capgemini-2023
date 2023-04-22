import React, { useRef } from "react";
import MapView from "react-native-maps";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View, Image, FlatList } from "react-native";
import * as Location from "expo-location";
import useWebSocket from "react-native-use-websocket";
import * as Progress from 'react-native-progress';
import Slider from '@react-native-community/slider';
import { SimpleLineIcons, FontAwesome, Entypo } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';


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
  const [warnings,] = useState([]);

  const showWarning = (warning) => {
    Toast.show({
      type: 'error',
      text1: 'Warning!',
      text2: warning
    });
  }

  const buttonLockDoorHandler = () => {
    console.log('You have been clicked a button!');
    // do something
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => showWarning('abc')}>
        <Image source={require('./car.png')}
          style={styles.teslaImage} />
      </TouchableOpacity>

      <View style={styles.statRow}>
        <SimpleLineIcons
          name="energy"
          color="#F5D21F"
          size={40}
        />
        <Text style={styles.batteryText}>
          {battery * 100}%
        </Text>
        <Progress.Bar
          progress={battery}
          height={40}
          width={250}
          color='#F5D21F'
        />
      </View>
      <View style={styles.statRow}>
        <TouchableOpacity
          onPress={buttonLockDoorHandler}
          style={styles.temperatureButton}>
          <Text style={styles.temperatureText}>
            +
          </Text>
        </TouchableOpacity>
        <Text style={styles.temperatureText}>15℃</Text>
        
        <TouchableOpacity
          onPress={buttonLockDoorHandler}
          style={styles.temperatureButton}>
          <Text style={styles.temperatureText}>
            -
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.temperatureContainer}>
        <View>
        </View>
      </View>
      <Toast
        position='top'
        bottomOffset={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: '15%',
    // justifyContent: 'center',
  },
  statsContainer: {
    flex: 2,
    alignItems: 'center',
    margin: 10,
    padding: 10
  },
  statRow: {
    flexDirection: 'row',
    margin: 3,
    padding: 3
  },
  batteryText: {
    color: '#F5D21F', 
    fontSize: 25,
    margin: 5
  },
  teslaImage: {
    width: 300,
    height: 200,
    margin: 50
  },
  temperatureContainer: {
    display: "flex",
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    margin: 10,
    padding: 18, 
    borderRadius: 100,
  },
  modifyTemperatureContainer: {
    display: "flex",
    flexDirection: 'column',
  },
  temperatureButton: {
    // width: 45,
    // height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // borderRadius: 80,
    // backgroundColor: '#ADD8E6',
    marginHorizontal: 10, 
    fontSize: 40
  },
  temperatureText: {
    fontSize: 40, 
    textShadowColor: 'grey',
    alignContent: 'center',
    alignItems: 'center'
  }
});


{/* <View style={styles.doorContainer}>
  <TouchableOpacity
    onPress={buttonLockDoorHandler}
    style={styles.lockDoorButton}>
    <Entypo
      name="lock"
      color="#D3D3D3"
      size={40}
    />
  </TouchableOpacity>
  <TouchableOpacity
    onPress={buttonLockDoorHandler}
    style={styles.unlockDoorButton}>
    <Entypo
      name="lock-open"
      color="#D3D3D3"
      size={20}
    />
  </TouchableOpacity>
</View> */
}
// lockDoorButton: {
//   width: 100,
//     height: 100,
//       justifyContent: 'center',
//         alignItems: 'center',
//           padding: 10,
//             borderRadius: 100,
//               backgroundColor: '#808080',
//   },
// unlockDoorButton: {
//   width: 70,
//     height: 70,
//       justifyContent: 'center',
//         alignItems: 'center',
//           padding: 10,
//             borderRadius: 100,
//               backgroundColor: '#808080',
//   },
// doorContainer: {
//   display: "flex",
//     flexDirection: 'row',
//       justifyContent: 'center',
//         alignContent: 'center',
//           alignItems: 'center',
//   },