import inspect
from typing import Callable, List, Optional, Union

import torch
from tqdm import tqdm
import PIL

from transformers import CLIPTextModel, CLIPTokenizer

from diffusers import StableDiffusionInpaintPipeline, DiffusionPipeline, DPMSolverMultistepScheduler
from diffusers.configuration_utils import FrozenDict
from diffusers.models import AutoencoderKL, UNet2DConditionModel
from diffusers.pipeline_utils import DiffusionPipeline
from diffusers.schedulers import (
    DDIMScheduler,
    EulerAncestralDiscreteScheduler,
    EulerDiscreteScheduler,
    LMSDiscreteScheduler,
    PNDMScheduler,
)
from diffusers.utils import is_accelerate_available, logging
from diffusers.pipelines.stable_diffusion import StableDiffusionPipelineOutput

from scripts.utils import prepare_mask_and_masked_image, numpy_to_pil, fit_image
from components.autoencoder import load_vae
from components.scheduler import load_scheduler, swap_scheduler
from components.unet import load_unet
from components.tokenizer import load_tokenizer
from components.text_encoder import load_text_encoder

logger = logging.get_logger(__name__)


class InpaintPipeline:
    def __init__(
        self,
        vae: AutoencoderKL,
        text_encoder: CLIPTextModel,
        tokenizer: CLIPTokenizer,
        unet: UNet2DConditionModel,
        scheduler: Union[DDIMScheduler, PNDMScheduler, LMSDiscreteScheduler],
        device: torch.device,
        **kwargs,
    ):
        pass

    @staticmethod
    def create_modded_pipeline(opt):
        pipe = DiffusionPipeline.from_pretrained(
            'cache/sd2_inpainting',
            torch_dtype=torch.float16,
            local_files_only=True,
        )
        swap_scheduler(pipe, opt)
        pipe.run_safety_checker = lambda images, * \
            args, **kwargs: (images, False)
        # pipe.scheduler = DPMSolverMultistepScheduler.from_config(
        #     pipe.scheduler.config)
        return pipe

        pipe2 = StableDiffusionInpaintPipeline.from_pretrained(
            opt.inpaint_cache_path,
            torch_dtype=torch.float16,
        ).to('cuda')
        # pipe.safety_checker = lambda images, **kwargs: (images, False)
        tokenizer = load_tokenizer(opt)
        text_encoder = load_text_encoder(opt)
        device = torch.device(opt.device)
        pipe = InpaintPipeline(
            device=device,
            unet=pipe2.unet,
            vae=pipe2.vae,
            scheduler=pipe2.scheduler,
            tokenizer=tokenizer,
            text_encoder=text_encoder,
        )
        return pipe
