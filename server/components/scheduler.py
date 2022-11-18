from diffusers import (
    EulerAncestralDiscreteScheduler,
    EulerDiscreteScheduler,
    # DDPMScheduler,
    # KarrasVeScheduler,
    LMSDiscreteScheduler,
    PNDMScheduler
)


def load_scheduler(opt):
    scheduler_class = {
        'euler_ancestral': EulerAncestralDiscreteScheduler,
        'euler': EulerDiscreteScheduler,
        # 'ddpm': DDPMScheduler,
        # 'karras': KarrasVeScheduler,
        'lms': LMSDiscreteScheduler,
        'pndm': PNDMScheduler,
    }[opt.scheduler_class]
    return scheduler_class.from_config(opt.model_cache_path, subfolder='scheduler')
