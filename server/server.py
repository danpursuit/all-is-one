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
import output_manager as om
from output_manager import make_output_dir, num_with_ext, get_op_path, load_img, idx_name, delete_image, prefix_str
import itertools
import eventlet

make_output_dir()

app = Flask(__name__, static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet', 
ping_timeout=1000000, ping_interval=1000000, max_http_buffer_size=1e8)


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
        eventlet.sleep(0)
    return output_callback


def handle_procedural(data, op):
    print(f'got {op}Procedural', data)
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
    with open(os.path.join(get_op_path(op), 'batch_'+idx_name(op, start_idx, 'json')), 'w') as f:
        options['job_size'] = job_size
        json.dump(options, f)
    emit('jobStarted', {op: op, 'expectedCount': job_size})
    eventlet.sleep(0)
    idx_in_job=0
    try:
        for idx, x in enumerate(itertools.product(*[options[k] for k in keys])):
            if control.interrupt:
                print(f'leaving {op}Procedural from interrupt')
                break
            overrides = dict(zip(keys, x))
            print('generating', overrides)
            func = {
                'txt2img': process_txt2img,
                'img2img': process_img2img,
            }[op]
            func(overrides, create_output_callback(op),
                idx_in_job=idx_in_job,
                cf_idx_in_job=idx,
                job_size=job_size,
            )
            idx_in_job += cf_sizes[idx]
        with open(os.path.join(get_op_path(op), 'batch_'+idx_name(op, start_idx, 'json')), 'w') as f:
            options['job_size'] = idx_in_job
            json.dump(options, f)
    except:
        if control.interrupt:
            print('interrupted')
            with open(os.path.join(get_op_path(op), 'batch_'+idx_name(op, start_idx, 'json')), 'w') as f:
                options['job_size'] = idx_in_job
                json.dump(options, f)
        else:
            print('error', sys.exc_info()[0])
            raise
        # todo: edit metadata to indicate that this batch was interrupted
    control.clear_interrupt()

@socketio.on("txt2imgProcedural")
def handle_txt2imgProcedural(data):
    op = "txt2img"
    return handle_procedural(data, op)

@socketio.on("img2imgProcedural")
def handle_img2imgProcedural(data):
    op = "img2img"
    print('got img2imgProcedural', data)
    return handle_procedural(data, op)


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
    print('batch meta request', data)
    op = data['op']
    job_id = data['jobId']
    batch_name = f'batch_{prefix_str(job_id)}.json'
    try:
        with open(os.path.join(get_op_path(op), batch_name), 'r') as f:
            meta = json.load(f)
    except FileNotFoundError:
        print('failed to load batch meta', data, batch_name)
        return
    # add start_idx and end_idx
    meta['start_idx'] = om.job_to_start_idx(op, job_id)
    meta['end_idx'] = meta['start_idx'] + meta['job_size']
    print('job size', meta)
    # start_idx is the idx of the first name in the batch that is >= job_id
    emit('batchMeta', {'op': op, 'meta': meta, 'jobId': job_id})
    for idx in range(meta['start_idx'], meta['end_idx']):
        req_image_by_idx({'op': op, 'idx': idx})
        try:
            img, meta, idx = load_img(idx, op)
            emit('imageByIdx', {'op': op, 'img': pil_to_bytes(img), 'meta': meta, 'idx': idx})
        except FileNotFoundError:
            print('failed to load image')
            continue
       

@socketio.on('interrupt')
def handle_interrupt(data):
    def client_ok():
        emit('interrupted', {'ok': True})
    control.set_interrupt(client_ok)
    if opts.source is None:
        print('no source to interrupt')
        client_ok()
        control.clear_interrupt()

@socketio.on('deleteBatch')
def handle_delete_batch(data):
    op = data['op']
    idx = data['idx']
    name_str = idx_name(op, idx)
    with open(os.path.join(get_op_path(op), name_str+'.json'), 'r') as f:
        meta = json.load(f)
    job_id = meta['job_id']
    start_id = job_id
    end_id = job_id + meta['job_size']
    for im_id in range(start_id, end_id):
        try:
            os.remove(os.path.join(get_op_path(op), om.prefix_str(im_id)+'.png'))
        except FileNotFoundError:
            pass
        try:
            os.remove(os.path.join(get_op_path(op), om.prefix_str(im_id)+'.json'))
        except FileNotFoundError:
            pass
    try:
        os.remove(os.path.join(get_op_path(op), 'batch_'+om.prefix_str(job_id)+'.json'))
    except FileNotFoundError:
        pass
    print('deleted batch', op, job_id)
    count = num_with_ext(get_op_path(op), "png")
    emit('deletedBatch', {'op': op, 'idx': idx - meta['job_size'], 'jobId': job_id, 'numImages': count})

@socketio.on('deleteSingleImage')
def handle_delete_single_image(data):
    op = data['op']
    idx = data['idx']
    job_id, job_meta = delete_image(idx, op)
    print('deleted image', op, idx)
    emit('deletedSingleImage', {'op': op, 'idx': idx})
    if (job_meta['job_size'] > 0):
        req_batch_meta({'op': op, 'jobId': job_id})
    count_images({'op': op})
    try:
        img, meta, idx = load_img(idx, op)
    except FileNotFoundError:
        print('no extra image to load after deletion')
        return
    emit('imageByIdx', {'op': op, 'img': pil_to_bytes(img), 'meta': meta, 'idx': idx})

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5050)
