from diffusers import UNet2DConditionModel


def load_unet(opt):
    return UNet2DConditionModel.from_pretrained(
        opt.model_cache_path,
        subfolder='unet',
        torch_dtype=opt.dtype,
    )
