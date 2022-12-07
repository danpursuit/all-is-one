import torch
from diffusers import DiffusionPipeline
from components.scheduler import load_scheduler, swap_scheduler


class Txt2ImgPipeline:
    @staticmethod
    def create_pipeline(opt):
        model_path = opt.model_cache_path
        pipe = DiffusionPipeline.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            local_files_only=True,
        )
        swap_scheduler(pipe, opt)
