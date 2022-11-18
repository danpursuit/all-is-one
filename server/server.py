import sys
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS

import opts
from processors.txt2img import process_txt2img
from processors.img2img import process_img2img
from scripts.utils import pil_to_bytes

app = Flask(__name__, static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")


@app.route('/')
def home():
    return app.send_static_file('index.html')


@socketio.on("ping")
def handle_ping(data):
    print(type(data), data)
    data['steps'] += 1
    emit("pong", data)
    print("client has connected")


@socketio.on("img2img")
def handle_img2img(data):
    opts.update_opts(opts.img2img_opts, data)
    # real processing
    output = process_img2img()
    # encode bytes to base64
    for img in output:
        emit("img2imgResult", {'img': pil_to_bytes(img)})


if __name__ == '__main__':
    socketio.run(app, debug=True, port=5050)
