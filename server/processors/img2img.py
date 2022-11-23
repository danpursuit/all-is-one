import os
import torch
from tqdm import tqdm, trange
from pytorch_lightning import seed_everything
from PIL import Image

import opts
import control
from pipelines.img2img_pipeline import Img2ImgPipeline
from scripts.utils import bytes_to_pil
from output_manager import save_img


def step_callback(step: int, timestep: int, latents: torch.FloatTensor):
    print(f"Step {step} Timestep {timestep} Latents {latents.shape}")


def process_img2img(overrides=None, callback=None, idx_in_job=0, cf_idx_in_job=0, job_size=0):
    opt = opts.set_opts(opts.global_opts, opts.img2img_opts, overrides)

    if opt.img:
        init_image = bytes_to_pil(opt.img)
    else:
        init_image = Image.open(opt.imgpath).convert('RGB')
    # seed_everything(opt.seed)
    pipe = Img2ImgPipeline.create_pipeline(opt).to('cuda')

    generator = torch.Generator('cuda').manual_seed(opt.seed)
    idx_in_cf = 0
    for n in trange(opt.num_batches, desc="Batches"):
        if control.interrupt:
            break
        output = pipe(
            prompt=opt.prompt,
            strength=opt.strength,
            init_image=init_image,
            height=opt.height,
            width=opt.width,
            num_inference_steps=opt.num_inference_steps,
            guidance_scale=opt.guidance_scale,
            negative_prompt=opt.negative_prompt,
            num_images_per_prompt=opt.num_images_per_prompt,
            generator=generator,
            # callback=step_callback,
            # callback_steps=1,
        )
        for idx_in_batch, img in enumerate(output):
            img, meta, idx = save_img(img, opt, 
                idx_in_cf=idx_in_cf, 
                idx_in_job=idx_in_job+idx_in_cf,
                cf_idx_in_job=cf_idx_in_job,
                job_size=job_size
            )
            idx_in_cf += 1
            if callback:
                callback(img, meta, idx)
    opts.clear_opts()
    return output


if __name__ == "__main__":
    process_img2img()
