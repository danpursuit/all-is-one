from transformers import CLIPTokenizer


def load_tokenizer(opt):
    return CLIPTokenizer.from_pretrained(
        opt.model_cache_path,
        subfolder='tokenizer',
        torch_dtype=opt.dtype,
    )
