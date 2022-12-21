from types import SimpleNamespace
import torch
import random
import os
import json

from constants import EMPTY_MODEL

cf_path = os.path.join(os.path.dirname(__file__), 'local.config')
force_defaults = False
if not os.path.exists(cf_path) or force_defaults:
    defaults = dict(
        regularChoice=EMPTY_MODEL,
        inpaintingChoice=EMPTY_MODEL,
        outpaintingChoice=EMPTY_MODEL,
        outpath="outputs",
    )
    with open(cf_path, "w") as f:
        json.dump(defaults, f)
with open(cf_path, "r") as f:
    defaults = json.load(f)
global_opts_dict = dict(defaults)
global_opts_dict.update(dict(
    dtype=torch.float16,
    device=torch.device(
        "cuda") if torch.cuda.is_available() else torch.device("cpu"),
    context="global",
    outpath="outputs",
))
# print('global_opts_dict', global_opts_dict)


def save_defaults(data):
    with open(cf_path, "r") as f:
        defaults = json.load(f)
    defaults.update(data)
    print('saving defaults', defaults)
    with open(cf_path, "w") as f:
        json.dump(defaults, f)


txt2img_opts_dict = dict(
    num_batches=1,
    prompt='digital painting of a boy holding a guitar, movie poster, 8k, intricate',
    negative_prompt='low quality, bad hands',
    guidance_scale=18.,
    num_inference_steps=20,
    height=512,
    width=512,
    seed=1212475738,
    num_images_per_prompt=1,
    context="txt2img",
    scheduler_class='pndm',
)

img2img_opts_dict = dict(
    num_batches=1,
    prompt='digital painting of a space car, movie poster, 8k, intricate',
    negative_prompt='',
    guidance_scale=8.,
    num_inference_steps=30,
    seed=42,
    img=None,
    strength=0.75,
    num_images_per_prompt=1,
    context="img2img",
    scheduler_class='pndm',
)
img2vid_opts_dict = dict(
    prompt_kf={0: 'a goldfish'},
    negative_prompt_kf={0: ''},
    guidance_scale_kf={0: 8.},
    strength_kf={0: 0.75},
    num_inference_steps_kf={0: 30},
    noise_kf={0: 0.02},
    angle_kf={0: 0.},
    zoom_kf={0: 1.},
    tx_kf={0: 0.},
    ty_kf={0: 0.},
    seed_behavior='fixed',
    seed=42,
    num_frames=30,
    frame_rate=30,
    num_batches=1,
    num_images_per_prompt=1,
    wrap_border=False,
    context="img2vid",
)
editing_opts_dict = dict(
    num_batches=1,
    img=None,
    context="editing",
    face_res_pct=0,
    do_upscaling=False,
    height=512,
    width=512,
    lanczos_mix=0,
    seed=1,
)

global_opts = SimpleNamespace(**global_opts_dict)
txt2img_opts = SimpleNamespace(**txt2img_opts_dict)
img2img_opts = SimpleNamespace(**img2img_opts_dict)
img2vid_opts = SimpleNamespace(**img2vid_opts_dict)
editing_opts = SimpleNamespace(**editing_opts_dict)

source = None


def sim_opts(*args):
    opt = SimpleNamespace()
    for arg in args:
        if arg is None:
            continue
        if isinstance(arg, dict):
            arg = SimpleNamespace(**arg)
        for k, v in arg.__dict__.items():
            setattr(opt, k, v)
    opt.seed = int(opt.seed)
    if opt.seed == -1:
        opt.seed = random.randint(0, 2**32)
    return opt


def set_opts(*args):
    global source
    if source:
        raise Exception("opts already set")
    source = sim_opts(*args)
    return source


def fix_client_options(options):
    options['seed'] = [int(s) for s in options['seed']]
    if len(options['seed']) == 1 and options['seed'][0] == -1:
        options['seed'][0] = random.randint(0, 2**32)
        print('fixed random seed to', options['seed'])
    return options


def fix_client_options_video(options):
    for key, val in options.items():
        if key.endswith('_kf'):
            options[key] = [{int(v['frame']): v['value'] for v in val}]
    return options


# pass in one of the defined Namespaces to override globally
def update_opts(opt, overrides):
    if not overrides:
        return opt
    for k, v in overrides.items():
        # raise error if k is not attr of opt
        if not hasattr(opt, k):
            raise AttributeError(f"{opt.context} has no attribute {k}")
        setattr(opt, k, v)
    return opt


def save_opts(opt, path):
    with open(path, "w") as f:
        for k, v in opt.__dict__.items():
            f.write(f"{k}={v}")


def load_opts(path):
    with open(path, "r") as f:
        lines = f.readlines()
    opt = SimpleNamespace()
    for line in lines:
        k, v = line.split("=")
        setattr(opt, k, v)
    return opt


def clear_opts():
    global source
    source = None
