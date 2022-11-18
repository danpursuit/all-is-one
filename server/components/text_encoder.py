from transformers import CLIPTextModel


def load_text_encoder(opt):
    return CLIPTextModel.from_pretrained(
        opt.model_cache_path,
        subfolder='text_encoder',
        torch_dtype=opt.dtype,
    )
