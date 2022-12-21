import os
import opts
import json
from PIL import Image
import subprocess

output_path = os.path.join(os.path.dirname(__file__), opts.global_opts.outpath)
ops = ['txt2img', 'img2img', 'img2vid', 'editing']

op_opt_keys = {
    # "txt2img": [k for k in opts.txt2img_opts_dict.keys() if k not in ['num_batches']],
    "txt2img": list(opts.txt2img_opts_dict.keys()),
    "img2img": list(opts.img2img_opts_dict.keys()),
    "img2vid": list(opts.img2vid_opts_dict.keys()),
    "editing": list(opts.editing_opts_dict.keys()),
}


def is_video(op):
    return op == 'img2vid'


def get_start_idx(op):
    if is_video(op):
        return len(os.listdir(get_op_path(op)))
    else:
        return num_with_ext(get_op_path(op), "png")


def make_output_dir():
    for op in ops:
        op_path = get_op_path(op)
        os.makedirs(op_path, exist_ok=True)


def num_with_ext(path, ext):
    return len([f for f in os.listdir(path) if f.endswith(ext)])


def get_op_path(op):
    assert op in ops, f"op {op} not in {ops}"
    return os.path.join(output_path, op)


def get_folder_path(op, folder_id):
    op_path = get_op_path(op)
    folder_path = os.path.join(op_path, f'vid_{prefix_str(folder_id)}')
    return folder_path


def prefix_str(idx):
    return f"{idx:05d}"


def idx_name(op, idx, ext=None):
    # open the directory and load list of all .png files
    # sort png files by name
    # if idx is in the list, return the name
    # else, return int(name of last file) + (idx - len(list)) + 1
    files = os.listdir(get_op_path(op))
    files = sorted([f for f in files if f.endswith('.png')])
    if idx < len(files):
        prefix = int(files[idx].split('.')[0])
    elif len(files) == 0:
        prefix = idx
    else:
        prefix = int(files[-1].split('.')[0]) + (idx - len(files)) + 1
    if ext is None:
        return prefix_str(prefix)
    return f"{prefix_str(prefix)}.{ext}"


def job_to_start_idx(op, job_id):
    name_ids = [int(f.split('.')[0])
                for f in os.listdir(get_op_path(op)) if f.endswith('.png')]
    return len([i for i in name_ids if i < job_id])


def save_img(img, opt, **kwargs):
    assert opt.context in ops
    op = opt.context
    op_path = get_op_path(op)
    idx = num_with_ext(op_path, "png")
    prefix = idx_name(op, idx)
    print('saving new image', idx, prefix)
    print(os.path.join(op_path, prefix+'.png'))
    img.save(os.path.join(op_path, prefix+'.png'))
    meta = {k: v for k, v in kwargs.items()}
    for k in op_opt_keys[opt.context]:
        meta[k] = getattr(opt, k)
    meta['job_id'] = int(prefix) - meta['idx_in_job']
    with open(os.path.join(op_path, prefix+'.json'), "w") as f:
        json.dump(meta, f)
    return img, meta, idx


def save_img2vid_data(op, meta):
    assert op == 'img2vid'
    folder_id = len(os.listdir(get_op_path(op)))
    folder_path = get_folder_path(op, folder_id)
    os.makedirs(folder_path, exist_ok=True)
    fname = f'{prefix_str(folder_id)}.json'
    with open(os.path.join(folder_path, fname), "w") as f:
        json.dump(meta, f)


def save_img2vid_img(img, opt, folder_id):
    op = opt.context
    assert op == 'img2vid'
    folder_path = get_folder_path(op, folder_id)
    idx = num_with_ext(folder_path, "png")
    fname = f'{prefix_str(idx)}.png'
    print('saving new image', idx, fname)
    img.save(os.path.join(folder_path, fname))
    return img, idx


def create_video(opt, folder_id):
    op = opt.context
    assert op == 'img2vid'
    folder_path = get_folder_path(op, folder_id)
    cmd = f'ffmpeg -y -vcodec png -r {opt.frame_rate} -i {folder_path}/%05d.png -c:v libx264 -vf fps={opt.frame_rate} -pix_fmt yuv420p -crf 17 -preset veryfast {folder_path}/video.mp4'
    print('video command:', cmd)
    process = subprocess.Popen(
        cmd.split(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    if process.returncode != 0:
        print(stderr)
        raise RuntimeError(stderr)
    print('video created successfully.')


def load_img(idx, op):
    assert op in ops
    op_path = get_op_path(op)
    name_str = idx_name(op, idx)
    print('loading image', idx, name_str)
    name_id = int(name_str)
    img = Image.open(os.path.join(op_path, name_str+'.png'))
    with open(os.path.join(op_path, name_str+'.json'), "r") as f:
        meta = json.load(f)
    # meta['name_id'] = name_id
    # meta['job_id'] = name_id - meta['idx_in_job']
    return img, meta, idx


def load_vid(idx, op):
    assert op in ops
    folder_path = get_folder_path(op, idx)
    name = prefix_str(idx)
    print('loading vid', idx, folder_path, name)
    with open(os.path.join(folder_path, name + '.json'), "r") as f:
        meta = json.load(f)
    with open(os.path.join(folder_path, 'video'+'.mp4'), "rb") as f:
        mov = f.read()
    return mov, meta, idx


def delete_image(idx, op):
    assert op in ops
    op_path = get_op_path(op)
    name_str = idx_name(op, idx)
    with open(os.path.join(get_op_path(op), name_str+'.json'), 'r') as f:
        meta = json.load(f)
        job_id = meta['job_id']
    with open(os.path.join(get_op_path(op), f'batch_{prefix_str(job_id)}.json'), 'r') as f:
        job_meta = json.load(f)
    job_meta['job_size'] -= 1
    with open(os.path.join(get_op_path(op), f'batch_{prefix_str(job_id)}.json'), 'w') as f:
        json.dump(job_meta, f)
    os.remove(os.path.join(op_path, name_str+'.png'))
    os.remove(os.path.join(op_path, name_str+'.json'))
    return job_id, job_meta
