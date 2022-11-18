from types import SimpleNamespace
import torch

global_opts_dict = dict(
    # model_cf_path='src/latent-diffusion/configs/stable-diffusion/v1-inference.yaml',
    # model_ckpt_path='models/model.ckpt',
    # ddim_diffuser_path='models/diffusion_ddim',
    # ddim_vae_path='models/diffusion_ddim/vae',

    sd_name='CompVis/stable-diffusion-v1-4',
    model_cache_path='cache/sd',
    scheduler_class='pndm',
    lowram=False,
    lowvram=False,
    medvram=True,
    dtype=torch.float16,
    device=torch.device(
        "cuda") if torch.cuda.is_available() else torch.device("cpu"),
    intC=4,  # number of channels
    intF=8,  # downsampling factor
    ddim_eta=0.0,
    kdiff_quantize=False,
    context="global",
)

txt2img_opts_dict = dict(
    num_batches=1,
    prompt='digital painting of a boy holding a guitar, movie poster, 8k, intricate',
    negative='low quality, bad hands',
    guidance_scale=18.,
    num_inference_steps=20,
    height=512,
    width=512,
    outpath="outputs/txt2img",
    seed=1212475738,
    num_images_per_prompt=1,
    context="txt2img",
)
img2img_opts_dict = dict(
    num_batches=1,
    prompt='digital painting of a space car, movie poster, 8k, intricate',
    negative_prompt='',
    guidance_scale=8.,
    num_inference_steps=30,
    height=512,
    width=512,
    outpath="outputs/img2img",
    seed=42,
    imgpath="outputs/txt2img/00000.png",
    img=None,
    strength=0.75,
    num_images_per_prompt=1,
    context="img2img",
)

global_opts = SimpleNamespace(**global_opts_dict)
txt2img_opts = SimpleNamespace(**txt2img_opts_dict)
img2img_opts = SimpleNamespace(**img2img_opts_dict)

source = None


def set_opts(*args):
    global source
    if source:
        raise RuntimeError("opts already set")
    opt = SimpleNamespace()
    for arg in args:
        if arg is None:
            continue
        if isinstance(arg, dict):
            arg = SimpleNamespace(**arg)
        for k, v in arg.__dict__.items():
            setattr(opt, k, v)
    source = opt
    return opt


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
