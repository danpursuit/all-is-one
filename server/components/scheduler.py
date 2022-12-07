from diffusers import (
    EulerAncestralDiscreteScheduler,
    EulerDiscreteScheduler,
    # DDPMScheduler,
    # KarrasVeScheduler,
    LMSDiscreteScheduler,
    PNDMScheduler,
    DDIMScheduler,
    DPMSolverMultistepScheduler,
    StableDiffusionPipeline
)
from diffusers.models import AutoencoderKL
import torch
from scripts.utils import prepare_scheduler
import opts

# vae = AutoencoderKL.from_pretrained("stabilityai/sd-vae-ft-mse")
# base_pipe = StableDiffusionPipeline.from_pretrained(
#     opts.global_opts.model_cache_path,
#     revision="fp16",
#     torch_dtype=torch.float16,
#     use_auth_token=False,
#     vae=vae,
# )
# vae.to(torch.float16)

schedulers = {}
# schedulers['plms'] = base_pipe.scheduler
# schedulers['ddim'] = prepare_scheduler(
#     DDIMScheduler(
#         beta_start=0.00085,
#         beta_end=0.012,
#         beta_schedule="scaled_linear",
#         clip_sample=False,
#         set_alpha_to_one=False,
#     )
# )
# schedulers['lms'] = prepare_scheduler(
#     LMSDiscreteScheduler(
#         beta_start=0.00085, beta_end=0.012, beta_schedule="scaled_linear"
#     )
# )
# schedulers['dpm'] = prepare_scheduler(
#     DPMSolverMultistepScheduler.from_config(base_pipe.scheduler.config)
# )
# schedulers['euler'] = prepare_scheduler(
#     EulerDiscreteScheduler.from_config(base_pipe.scheduler.config)
# )
# schedulers['euler_ancestral'] = prepare_scheduler(
#     EulerAncestralDiscreteScheduler.from_config(base_pipe.scheduler.config)
# )

swaps = {
    'dpm': DPMSolverMultistepScheduler,
    'euler': EulerDiscreteScheduler,
    'euler_ancestral': EulerAncestralDiscreteScheduler,
}


def swap_scheduler(pipe, opt):
    if opt.scheduler_class in swaps:
        print('Setting scheduler', opt.scheduler_class)
        pipe.scheduler = swaps[opt.scheduler_class].from_config(
            pipe.scheduler.config)
    else:
        print('BAD swap', opt.scheduler_class)
        pipe.scheduler = load_scheduler(opt)
    return pipe


def load_scheduler(opt):
    return schedulers[opt.scheduler_class]
    # scheduler_class = {
    #     'euler_ancestral': EulerAncestralDiscreteScheduler,
    #     'euler': EulerDiscreteScheduler,
    #     # 'ddpm': DDPMScheduler,
    #     # 'karras': KarrasVeScheduler,
    #     'lms': LMSDiscreteScheduler,
    #     'pndm': PNDMScheduler,
    # }[opt.scheduler_class]
    # if opt.scheduler_class == 'lms':
    #     return prepare_scheduler(LMSDiscreteScheduler(
    #         beta_start=0.00085, beta_end=0.012, beta_schedule="scaled_linear"
    #     ))
    # return scheduler_class.from_config(opt.model_cache_path, subfolder='scheduler')
