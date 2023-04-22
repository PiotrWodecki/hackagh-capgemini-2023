import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

app = FastAPI()

class Battery:
    def __init__(self):
        self.percent = 1.0  # fully charged at the beginning
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

    def get_json(self):
        return {
            "type": "TEMPERATURE",
            "payload": {
                "celsius": self.celsius
            }
        }

app_websockets = []
car_websockets = []

battery = Battery()
speed = Speed()
tempereature = Tempereature()

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
                await websocket.send_json(battery.get_json_charging())
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
            elif message_type == "CHARGING_STATE":
                for w in app_websockets:
                    await w.send_json(battery.get_json_charging())
            elif message_type == "CHARGING_SET":
                battery.charging = bool(message["payload"]["charging"])
                print("Charging: ", battery.charging)
                for w in car_websockets:
                    await w.send_json(battery.get_json_charging())
            else:
                print("Unknown message type: ", message_type)
    except WebSocketDisconnect:
        if websocket in app_websockets:
            print("App disconnected")
            app_websockets.remove(websocket)
        if websocket in car_websockets:
            print("Car disconnected")
            car_websockets.remove(websocket)
