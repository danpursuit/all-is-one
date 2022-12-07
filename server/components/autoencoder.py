from diffusers import AutoencoderKL


def load_vae(opt, path=None):
    raise DeprecationWarning
    path = path or opt.model_cache_path
    return AutoencoderKL.from_pretrained(
        path,
        subfolder='vae',
        torch_dtype=opt.dtype,
    )
