from fastapi_utils.tasks import repeat_every
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from datetime import datetime
from datetime import time

app = FastAPI()

class Battery:
    def __init__(self):
        self.percent = 0.0 
        self.charging = False
    def get_json_percent(self):
        return {
            "type": "BATTERY",
            "payload": {
                "percent": self.percent
            }
        }
    def get_json_charging(self):
        return {
            "type": "CHARGING_STATE",
            "payload": {
                "charging": self.charging
            }
        }

class Speed:
    def __init__(self):
        self.kmph = 0.0

    def get_json(self):
        return {
            "type": "SPEED",
            "payload": {
                "speed": self.kmph
            }
        }

class Tempereature:
    def __init__(self):
        self.celsius = 20.0
        self.state = False
        self.target = 20.0

    def get_json(self):
        return {
            "type": "TEMPERATURE",
            "payload": {
                "temp": self.celsius
            }
        }

    def get_json_set(self):
        return {
            "type": "TEMPERATURE_SET",
            "payload": {
                "temp": self.target
            }
        }
    
    def get_json_state(self):
        return {
            "type": "TEMPERATURE_STATE",
            "payload": {
                "state": self.state
            }
        }

    def get_json_target(self):
        return {
            "type": "TEMPERATURE_TARGET",
            "payload": {
                "target": self.target
            }
        }

class Position:
    def __init__(self):
        self.lat = 0.0
        self.lon = 0.0

    def get_json(self):
        return {
            "type": "COORDS_CAR",
            "payload": {
                "latitude": self.lat,
                "longitude": self.lon
            }
        }

class Schedule:
    def __init__(self):
        self.schedule = [
            '2023-04-17T08:00:00',
            '2023-04-18T08:00:00',
            '2023-04-19T08:00:00',
            '2023-04-20T08:00:00',
            '2023-04-21T08:00:00',
            '2023-04-22T08:00:00',
            '2023-04-23T08:00:00',
        ]

    def get_json(self):
        return {
            "type": "SCHEDULE",
            "payload": {
                "schedule": self.schedule
            }
        }


app_websockets = []
car_websockets = []

battery = Battery()
speed = Speed()
tempereature = Tempereature()
position_car = Position()
position_app = Position()
schedule = Schedule()


def isNowAfterPeriod(startTime, nowTime): 
    # endtime is just after nowtime
    endTime = time(startTime.hour, startTime.minute + 1)
    return nowTime >= startTime and nowTime <= endTime


@app.on_event("startup")
@repeat_every(seconds=10)
async def check_time():
    now = datetime.now().utcnow()
    for i in range(len(schedule.schedule)):
        start_time = datetime.fromisoformat(schedule.schedule[i])
        if isNowAfterPeriod(time(start_time.hour, start_time.minute), time(now.hour, now.minute)):
            print("Auto chargin and heating started")
            for w in car_websockets:
                print("Sending charging and heating")
                await w.send_json(tempereature.get_json_set())
                battery.charging = True
                tempereature.state = True
                await w.send_json(tempereature.get_json_state())
                await w.send_json(battery.get_json_charging())
            for w in app_websockets:
                await w.send_json(tempereature.get_json_state())
                await w.send_json(battery.get_json_charging())


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                print("Invalid JSON: ", data)
                continue

            message_type = message.get("type")

            if message_type == "INIT_REQUEST_APP":
                print("New app connected")
                app_websockets.append(websocket)
                await websocket.send_json(battery.get_json_percent()),
                await websocket.send_json(speed.get_json()),
                await websocket.send_json(tempereature.get_json())
                await websocket.send_json(tempereature.get_json_state())
                await websocket.send_json(tempereature.get_json_target())
                await websocket.send_json(battery.get_json_charging())
                await websocket.send_json(position_car.get_json())
                await websocket.send_json(schedule.get_json())
            elif message_type == "INIT_REQUEST_CAR":
                print("New car connected")
                car_websockets.append(websocket)
            elif message_type == "BATTERY":
                battery.percent = float(message["payload"]["percent"])
                print("Battery percent: ", battery.percent)
                for w in app_websockets:
                    await w.send_json(battery.get_json_percent())
            elif message_type == "SPEED":
                speed.kmph = float(message["payload"]["speed"])
                print("Speed: ", speed.kmph)
                for w in app_websockets:
                    await w.send_json(speed.get_json())
            elif message_type == "TEMPERATURE":
                tempereature.celsius = float(message["payload"]["temp"])
                print("Temperature: ", tempereature.celsius)
                for w in app_websockets:
                    await w.send_json(tempereature.get_json())
            elif message_type == "TEMPERATURE_TARGET":
                print("Temperature: ", tempereature.celsius)
                for w in app_websockets:
                    await w.send_json(tempereature.get_json_target())
            elif message_type == "TEMPERATURE_SET":
                tempereature.target = float(message["payload"]["target"])
                print("Temperature set: ", tempereature.target)
                for w in car_websockets:
                    await w.send_json(tempereature.get_json_set())
                for w in app_websockets:
                    await w.send_json(tempereature.get_json_target())
            elif message_type == "TEMPERATURE_STATE":
                tempereature.state = bool(message["payload"]["state"])
                print("Temperature control state: ", tempereature.state)
                for w in car_websockets:
                    await w.send_json(tempereature.get_json_state())
                for w in app_websockets:
                    await w.send_json(tempereature.get_json_state())
            elif message_type == "CHARGING_STATE":
                for w in app_websockets:
                    await w.send_json(battery.get_json_charging())
            elif message_type == "CHARGING_SET":
                battery.charging = bool(message["payload"]["charging"])
                print("Charging: ", battery.charging)
                for w in car_websockets:
                    await w.send_json(battery.get_json_charging())
            elif message_type == "COORDS_CAR":
                position_car.lat = float(message["payload"]["latitude"])
                position_car.lon = float(message["payload"]["longitude"])
                print("Position: ", position_car.lat, position_car.lon)
                for w in app_websockets:
                    await w.send_json(position_car.get_json())
            elif message_type == "COORDS_APP":
                position_app.lat = float(message["payload"]["latitude"])
                position_app.lon = float(message["payload"]["longitude"])
                print("Position: ", position_app.lat, position_app.lon)
                for w in car_websockets:
                    await w.send_json(position_app.get_json())
            elif message_type == "SCHEDULE":
                schedule.schedule = message["payload"]["schedule"]
                print("Schedule: ", schedule.schedule)
                for w in app_websockets:
                    await w.send_json(schedule.get_json())
            elif message_type == "SCHEDULE_GET":
                print("Schedule get: ", schedule.schedule)
                for w in app_websockets:
                    await w.send_json(schedule.get_json())
            else:
                print("Unknown message type: ", message_type)
    except WebSocketDisconnect:
        if websocket in app_websockets:
            print("App disconnected")
            app_websockets.remove(websocket)
        if websocket in car_websockets:
            print("Car disconnected")
            car_websockets.remove(websocket)
    except RuntimeError as e:
        print("Runtime error", e)
