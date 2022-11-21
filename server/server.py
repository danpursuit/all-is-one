import sys
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS

import opts
from processors.txt2img import process_txt2img
from processors.img2img import process_img2img
from scripts.utils import pil_to_bytes
from output_manager import make_output_dir
import itertools

make_output_dir()

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

def create_output_callback(op):
    def output_callback(img, meta, idx):
        img_bytes = pil_to_bytes(img)
        emit(f'{op}Result', {"img": img_bytes, "meta": meta, "idx": idx})
    return output_callback


@socketio.on("txt2imgProcedural")
def handle_txt2imgProcedural(data):
    options = data['options']
    keys = list(options.keys())
    for x in itertools.product(*[options[k] for k in keys]):
        overrides = dict(zip(keys, x))
        print(overrides)
        process_txt2img(overrides, create_output_callback('txt2img'))


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
