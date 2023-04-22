# hackagh

## server

Run the server with:

```shell
cd server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

You can reach the websocket at `ws://localhost:8000/ws`.

To expose the websocket you need to use [localtunnel](https://github.com/localtunnel/localtunnel). Expose to internet with:

```shell
lt --host http://loca.lt --port 8000
```

Then you can use `ws://<created_domain>/ws`
