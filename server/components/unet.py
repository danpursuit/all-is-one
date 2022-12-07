from diffusers import UNet2DConditionModel


def load_unet(opt, path=None):
    path = path or opt.model_cache_path
    print('loading path', path)
    return UNet2DConditionModel.from_pretrained(
        path,
        subfolder='unet',
        torch_dtype=opt.dtype,
    )
