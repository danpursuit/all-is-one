import os
import opts
import json
from PIL import Image

output_path = os.path.join(os.path.dirname(__file__), opts.global_opts.outpath)
ops = ['txt2img', 'img2img']

op_opt_keys = {
    # "txt2img": [k for k in opts.txt2img_opts_dict.keys() if k not in ['num_batches']],
    "txt2img": list(opts.txt2img_opts_dict.keys()),
    "imt2img": list(opts.img2img_opts_dict.keys()),
}


def make_output_dir():
    for op in ops:
        op_path = os.path.join(output_path, op)
        os.makedirs(op_path, exist_ok=True)


def name(idx, ext):
    return f"{idx:05d}.{ext}"


def num_with_ext(path, ext):
    return len([f for f in os.listdir(path) if f.endswith(ext)])


def get_op_path(op):
    return os.path.join(output_path, op)


def save_img(img, opt, **kwargs):
    assert opt.context in ops
    op_path = os.path.join(output_path, opt.context)
    idx = num_with_ext(op_path, "png")
    img.save(os.path.join(op_path, name(idx, "png")))
    # add to meta:
    # currently, num_images_per_prompt
    # want total job size (num_images_per_prompt -> num_batches -> num_configs)
    # job_size
    # idx_in_job
    # cf_idx_in_job
    # idx_in_cf
    meta = {k: v for k, v in kwargs.items()}
    for k in op_opt_keys[opt.context]:
        meta[k] = getattr(opt, k)
    with open(os.path.join(op_path, name(idx, "json")), "w") as f:
        json.dump(meta, f)
    return img, meta, idx


def load_img(idx, op):
    assert op in ops
    op_path = os.path.join(output_path, op)
    img = Image.open(os.path.join(op_path, name(idx, "png")))
    with open(os.path.join(op_path, name(idx, "json")), "r") as f:
        meta = json.load(f)
    return img, meta, idx
