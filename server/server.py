from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS

# image
import io
import base64
from PIL import Image

app = Flask(__name__, static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")


# When someone goes to / on the server, execute the following function
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
    img = Image.open(io.BytesIO(base64.b64decode(
        data['img'].split(';')[1].split(',')[1])))
    # flip image
    img = img.transpose(Image.FLIP_LEFT_RIGHT)
    # encode image to bytes
    with io.BytesIO() as output:
        img.save(output, format="PNG")
        contents = output.getvalue()
    # encode bytes to base64
    emit("img2imgResult", {'img': base64.b64encode(contents).decode('utf-8')})


# If the script that was run is this script (we have not been imported)
if __name__ == '__main__':
    socketio.run(app, debug=True, port=5050)  # Start the server
