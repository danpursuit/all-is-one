import sys
import functools
import os
import json
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS

import opts
import control
from processors.txt2img import process_txt2img
from processors.img2img import process_img2img
from scripts.utils import pil_to_bytes
from output_manager import make_output_dir, num_with_ext, get_op_path, load_img, name
import itertools

make_output_dir()

app = Flask(__name__, static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet', ping_timeout=1000000, ping_interval=1000000)


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
        print('sending resultADD_IMAGE')
        emit(f'{op}Result', {"img": img_bytes, "meta": meta, "idx": idx})
    return output_callback


@socketio.on("txt2imgProcedural")
def handle_txt2imgProcedural(data):
    print('got txt2imgProcedural', data)
    op = "txt2img"
    options = opts.fix_client_seed(data['options'])
    keys = list(options.keys())
    job_size = 0
    cf_sizes = {}
    start_idx = num_with_ext(get_op_path(op), "png")
    for idx, x in enumerate(itertools.product(*[options[k] for k in keys])):
        # todo: make this more efficient
        overrides = dict(zip(keys, x))
        opt = opts.sim_opts(opts.global_opts, opts.txt2img_opts, overrides)
        job_size += opt.num_batches * opt.num_images_per_prompt
        cf_sizes[idx] = opt.num_batches * opt.num_images_per_prompt
    emit('jobStarted', {op: op, 'expectedCount': job_size})
    idx_in_job=0
    try:
        for idx, x in enumerate(itertools.product(*[options[k] for k in keys])):
            if control.interrupt:
                print('leaving txt2imgProcedural from interrupt')
                break
            overrides = dict(zip(keys, x))
            print('generating', overrides)
            process_txt2img(overrides, create_output_callback('txt2img'),
                idx_in_job=idx_in_job,
                cf_idx_in_job=idx,
                job_size=job_size,
            )
            idx_in_job += cf_sizes[idx]
        with open(os.path.join(get_op_path(op), 'batch_'+name(start_idx, 'json')), 'w') as f:
            json.dump(options, f)
    except:
        if control.interrupt:
            print('interrupted')
        else:
            print('error', sys.exc_info()[0])
            raise
        # todo: edit metadata to indicate that this batch was interrupted
    control.clear_interrupt()


@socketio.on("img2img")
def handle_img2img(data):
    opts.update_opts(opts.img2img_opts, data)
    # real processing
    output = process_img2img()
    # encode bytes to base64
    for img in output:
        emit("img2imgResult", {'img': pil_to_bytes(img)})


@socketio.on('reqNumImages')
def count_images(data):
    op = data['op']
    count = num_with_ext(get_op_path(op), "png")
    emit('numImages', {'op': op, 'numImages': count})

@socketio.on('reqImageByIdx')
def req_image_by_idx(data):
    op = data['op']
    idx = data['idx']
    try:
        img, meta, idx = load_img(idx, op)
    except FileNotFoundError:
        print('failed to load image')
        return
    emit('imageByIdx', {'op': op, 'img': pil_to_bytes(img), 'meta': meta, 'idx': idx})

@socketio.on('reqBatchMeta')
def req_batch_meta(data):
    op = data['op']
    idx = data['idx']
    try:
        with open(os.path.join(get_op_path(op), 'batch_'+name(idx, 'json')), 'r') as f:
            meta = json.load(f)
    except FileNotFoundError:
        print('failed to load batch meta')
        return
    emit('batchMeta', {'op': op, 'meta': meta, 'idx': idx})

@socketio.on('interrupt')
def handle_interrupt(data):
    def client_ok():
        emit('interrupted', {'ok': True})
    control.set_interrupt(client_ok)
    if opts.source is None:
        print('no source to interrupt')
        client_ok()
        control.clear_interrupt()

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5050)
