import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

app = FastAPI()

class Battery:
    def __init__(self):
        self.percent = 1.0  # fully charged at the beginning

    def get_json(self):
        print("Sending battery to client")
        return {
            "type": "BATTERY",
            "payload": {
                "percent": self.percent
            }
        }

class Speed:
    def __init__(self):
        self.kmph = 0.0

    def get_json(self):
        return {
            "type": "SPEED",
            "payload": {
                "speed": self.speed
            }
        }

app_websockets = {}

battery = Battery()
speed = Speed()

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

            if message_type == "INIT_REQUEST":
                app_websockets[websocket] = True
                await websocket.send_json(battery.get_json())
            elif message_type == "BATTERY":
                battery.percent = float(message["payload"]["percent"])
                print("Battery percent: ", battery.percent)
                tasks = []
                for w in app_websockets:
                    tasks.append(w.send_json(battery.get_json()))
                asyncio.gather(*tasks)
            elif message_type == "SPEED":
                speed.kmph = float(message["payload"]["speed"])
                print("Speed: ", speed.speed)
            else:
                print("Unknown message type: ", message_type)
    except WebSocketDisconnect:
        if websocket in app_websockets:
            del app_websockets[websocket]
