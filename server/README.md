# Server

## How to run

Run the server with:

```shell
cd server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

You can reach the websocket at `ws://localhost:8000/ws`.

## Tunneling

The hosts in the venue's network are isolated, so the server needs to be tunneled.

To expose the websocket to the internet you need to use [localtunnel](https://github.com/localtunnel/localtunnel).

```shell
lt --host http://loca.lt --port 8000 --local-host 127.0.0.1 --subdomain <domain>
```

Then you can use `ws://<created_domain>/ws` to connect.
