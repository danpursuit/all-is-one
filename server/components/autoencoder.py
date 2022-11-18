from diffusers import AutoencoderKL


def load_vae(opt):
    return AutoencoderKL.from_pretrained(
        opt.model_cache_path,
        subfolder='vae',
        torch_dtype=opt.dtype,
    )
