from diffusers import DiffusionPipeline, StableDiffusionImg2ImgPipeline, StableDiffusionInpaintPipeline, StableDiffusionInpaintPipelineLegacy
import torch

from components.scheduler import load_scheduler, swap_scheduler
from constants import EMPTY_MODEL
import model_finder as mf


class PipeWrapper:
    def __init__(self, model_name, opt, pipeline_class=DiffusionPipeline, pipe=None):
        if pipe is None:
            pipe = pipeline_class.from_pretrained(
                mf.get_model_path(model_name),
                torch_dtype=torch.float16,
                local_files_only=True,
            )
        swap_scheduler(pipe, opt)
        pipe.safety_checker = lambda images, **kwargs: (images, False)
        pipe.run_safety_checker = lambda images, * \
            args, **kwargs: (images, False)
        self.pipe = pipe.to('cuda')

    def __call__(self, *args, **kwds):
        output = self.pipe(*args, **kwds)
        return output['images']


def create_txt2img_pipeline(opt):
    return PipeWrapper(opt.regularChoice, opt)


def create_img2img_pipeline(opt):
    return PipeWrapper(opt.regularChoice, opt, pipeline_class=StableDiffusionImg2ImgPipeline)


def create_inpaint_pipeline(opt, old=False):
    if opt.inpaintingChoice == EMPTY_MODEL:
        print('old variant', opt.regularChoice)
        im_pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
            mf.get_model_path(opt.regularChoice), torch_dtype=torch.float16, local_files_only=True)
        new_pipe = StableDiffusionInpaintPipelineLegacy(
            vae=im_pipe.vae,
            text_encoder=im_pipe.text_encoder,
            tokenizer=im_pipe.tokenizer,
            unet=im_pipe.unet,
            scheduler=im_pipe.scheduler,
            safety_checker=im_pipe.safety_checker,
            feature_extractor=im_pipe.feature_extractor
        )
        return PipeWrapper(opt.regularChoice, opt, pipe=new_pipe)
    print('new inpainting variant')
    return PipeWrapper(opt.inpaintingChoice, opt, pipeline_class=DiffusionPipeline)


def create_outpaint_pipeline(opt):
    print('outpainting:', opt.outpaintingChoice)
    return PipeWrapper(opt.outpaintingChoice, opt, pipeline_class=DiffusionPipeline)
