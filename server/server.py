import sys
import functools
import os
import json
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import itertools
import eventlet
import PIL

import opts
import control
from processors.txt2img import process_txt2img
from processors.img2img import process_img2img
from processors.img2vid import process_img2vid
from processors.editing import process_editing
from scripts.utils import pil_to_bytes
import output_manager as om
from output_manager import make_output_dir, num_with_ext, get_op_path, load_img, idx_name, delete_image, prefix_str
import model_finder as mf

print('Server starting...')
make_output_dir()

app = Flask(__name__, static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet',
                    ping_timeout=1000000, ping_interval=1000000, max_http_buffer_size=1e9)


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
    if om.is_video(op):
        def output_callback(img, meta, idx):
            pass
    else:
        def output_callback(img, meta, idx):
            img_bytes = pil_to_bytes(img)
            emit(f'{op}Result', {"img": img_bytes, "meta": meta, "idx": idx})
            eventlet.sleep(0)
    return output_callback


def handle_procedural(data, op):
    options = opts.fix_client_options(data['options'])
    is_video = om.is_video(op)
    start_idx = om.get_start_idx(op)
    if is_video:
        # write the video metadata
        om.save_img2vid_data(op, options)
        # then fix options
        options = opts.fix_client_options_video(data['options'])
    print(f'got {op}Procedural', {i: j for i, j in dict(
        data['options']).items() if i != 'img'})
    keys = list(options.keys())
    job_size = 0
    cf_sizes = {}
    for idx, x in enumerate(itertools.product(*[options[k] for k in keys])):
        # todo: make this more efficient
        overrides = dict(zip(keys, x))
        opt = opts.sim_opts(opts.global_opts, getattr(
            opts, op+"_opts"), overrides)
        job_size += opt.num_batches * opt.num_images_per_prompt
        cf_sizes[idx] = opt.num_batches * opt.num_images_per_prompt
    if not is_video:
        # write img metadata before job starts
        with open(os.path.join(get_op_path(op), 'batch_'+idx_name(op, start_idx, 'json')), 'w') as f:
            options['job_size'] = job_size
            json.dump(options, f)
    emit('jobStarted', {'op': op, 'expectedCount': job_size})
    eventlet.sleep(0.01)
    idx_in_job = 0
    fail_msg = None
    try:
        for idx, x in enumerate(itertools.product(*[options[k] for k in keys])):
            if control.interrupt:
                print(f'leaving {op}Procedural from interrupt')
                break
            overrides = dict(zip(keys, x))
            print('generating', {i: j for i,
                  j in overrides.items() if i != 'img'})
            func = {
                'txt2img': process_txt2img,
                'img2img': process_img2img,
                'img2vid': process_img2vid,
                'editing': process_editing,
            }[op]
            func(overrides, create_output_callback(op),
                 idx_in_job=idx_in_job,
                 cf_idx_in_job=idx,
                 job_size=job_size,
                 )
            idx_in_job += cf_sizes[idx]
        if not is_video:
            with open(os.path.join(get_op_path(op), 'batch_'+idx_name(op, start_idx, 'json')), 'w') as f:
                options['job_size'] = idx_in_job
                json.dump(options, f)
        else:
            mov, meta, idx = om.load_vid(start_idx, op)
            emit(f'{op}Result', {"img": mov, "meta": meta, "idx": idx})
    except PIL.UnidentifiedImageError as error:
        print('Error', error)
        fail_msg = f'Unknown image file type. Full error:\n~~~\n{error}\n~~~'
    except RuntimeError as error:
        fail_msg = f'Your machine ran out of memory! Try reducing the dimensions of your output. Full error:\n~~~\n{error}\n~~~'
        print('Error', error)
        print('If you encounter CUDA out of memory, try reducing the dimensions of your output.')
    except:
        if control.interrupt:
            print('interrupted')
            if not is_video:
                with open(os.path.join(get_op_path(op), 'batch_'+idx_name(op, start_idx, 'json')), 'w') as f:
                    options['job_size'] = idx_in_job
                    json.dump(options, f)
        else:
            print('error', sys.exc_info()[0])
            raise
        opts.clear_opts()

    if fail_msg is not None:
        if not is_video:
            with open(os.path.join(get_op_path(op), 'batch_'+idx_name(op, start_idx, 'json')), 'w') as f:
                options['job_size'] = idx_in_job
                json.dump(options, f)
        opts.clear_opts()
        emit('interrupted', {'ok': True, 'msg': fail_msg})
    control.clear_interrupt()


@socketio.on("txt2imgProcedural")
def handle_txt2imgProcedural(data):
    op = "txt2img"
    return handle_procedural(data, op)


@socketio.on("img2imgProcedural")
def handle_img2imgProcedural(data):
    op = "img2img"
    return handle_procedural(data, op)


@socketio.on("img2vidProcedural")
def handle_img2vidProcedural(data):
    op = "img2vid"
    return handle_procedural(data, op)


@socketio.on("editingProcedural")
def handle_editingProcedural(data):
    for key, default_val in {
        'num_batches': 1,
        'num_images_per_prompt': 1,
        'seed': 1
    }.items():
        if key not in data['options']:
            data['options'][key] = [default_val]
    op = "editing"
    return handle_procedural(data, op)


@socketio.on('reqNumImages')
def count_images(data):
    op = data['op']
    count = om.get_start_idx(op)
    emit('numImages', {'op': op, 'numImages': count})


@socketio.on('reqImageByIdx')
def req_image_by_idx(data):
    op = data['op']
    idx = data['idx']
    if om.is_video(op):
        try:
            mov, meta, idx = om.load_vid(idx, op)
        except FileNotFoundError:
            print('failed to load vid')
            return
        emit('imageByIdx', {'op': op, 'img': mov, 'meta': meta, 'idx': idx})
    else:
        try:
            img, meta, idx = load_img(idx, op)
        except FileNotFoundError:
            print('failed to load image')
            return
        emit('imageByIdx', {'op': op, 'img': pil_to_bytes(
            img), 'meta': meta, 'idx': idx})


@socketio.on('reqBatchMeta')
def req_batch_meta(data):
    # print('batch meta request', data)
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
    # print('job size', meta)
    # start_idx is the idx of the first name in the batch that is >= job_id
    emit('batchMeta', {'op': op, 'meta': meta, 'jobId': job_id})
    for idx in range(meta['start_idx'], meta['end_idx']):
        req_image_by_idx({'op': op, 'idx': idx})


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
            os.remove(os.path.join(get_op_path(op),
                      om.prefix_str(im_id)+'.png'))
        except FileNotFoundError:
            pass
        try:
            os.remove(os.path.join(get_op_path(op),
                      om.prefix_str(im_id)+'.json'))
        except FileNotFoundError:
            pass
    try:
        os.remove(os.path.join(get_op_path(op),
                  'batch_'+om.prefix_str(job_id)+'.json'))
    except FileNotFoundError:
        pass
    print('deleted batch', op, job_id)
    count = om.get_start_idx(op)
    emit('deletedBatch', {'op': op, 'idx': idx -
         meta['job_size'], 'jobId': job_id, 'numImages': count})


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
    emit('imageByIdx', {'op': op, 'img': pil_to_bytes(
        img), 'meta': meta, 'idx': idx})


@socketio.on('reqModelData')
def req_model_data():
    emit('modelData', mf.get_model_data())


# @socketio.on('reqCacheModels')
# def req_cache_models():
#     emit('cacheModels', mf.get_cache_models())


# @socketio.on('reqCkpts')
# def req_ckpts():
# emit('localCkpts', mf.get_ckpts())


@socketio.on('saveModelChoices')
def save_model_choices(data):
    opts.update_opts(opts.global_opts, data)
    opts.save_defaults(data)


@socketio.on('downloadModel')
def download_model(data):
    print('starting download')
    name = data['name']
    mf.download_model(name)
    emit('modelData', mf.get_model_data(clear_download=True))


@socketio.on('downloadByRepoId')
def download_by_repo_id(data):
    print('starting download', data)
    mf.download_by_repo_id(
        save_name=data['save_name'], repo_id=data['repo_id'])
    emit('modelData', mf.get_model_data(clear_download=True))


@socketio.on('convertCkpt')
def download_model(data):
    print('starting conversion', data)
    mf.convert_ckpt(
        save_name=data['save_name'], ckpt_name=data['ckpt_name'], inpainting=data['inpainting']
    )
    emit('modelData', mf.get_model_data(clear_download=True))


@socketio.on('showFolder')
def show_folder(data):
    location = data['location'].lower()
    if location == 'cache':
        path = mf.cache_path
    elif location == 'ckpt':
        path = mf.ckpt_path
    elif location in om.ops:
        path = get_op_path(location)
    else:
        print('unknown location', location)
        return
    print('showing folder', path)
    try:
        import subprocess
        subprocess.Popen(f'explorer "{path}"')
    except:
        print('failed to open folder', path)


if __name__ == '__main__':
    port = 5050
    print('Starting server on port', port)
    print('Go to http://localhost:'+str(port)+'/ in your browser!')
    # socketio.run(app, debug=True, port=5050)
    socketio.run(app, debug=False, port=5050)
