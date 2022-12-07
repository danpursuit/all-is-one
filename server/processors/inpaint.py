import os
import torch
from tqdm import tqdm, trange
from pytorch_lightning import seed_everything
from PIL import Image

import opts
import control
from pipelines.inpaint_pipeline import InpaintPipeline
from pipelines.pipe_wrapper import create_inpaint_pipeline
from scripts.utils import bytes_to_pil, fit_image, scale_image
from output_manager import save_img
from diffusers import StableDiffusionInpaintPipeline


def step_callback(step: int, timestep: int, latents: torch.FloatTensor):
    print(f"Step {step} Timestep {timestep} Latents {latents.shape}")


def process_inpaint(overrides=None, callback=None, idx_in_job=0, cf_idx_in_job=0, job_size=0):
    opt = opts.set_opts(opts.global_opts, opts.img2img_opts, overrides)
    x_in = opt.img['x_in']
    y_in = opt.img['y_in']
    z_in = opt.img['z_in']
    x_out = opt.img['x_out']
    y_out = opt.img['y_out']
    w_out = opt.img['w_out']
    h_out = opt.img['h_out']
    original_img = scale_image(bytes_to_pil(opt.img['img']), z_in)
    init_image, margins = fit_image(original_img, x_in, y_in, x_out,
                                    y_out, w_out, h_out, fill=None)
    # seed_everything(opt.seed)

    # pipe = InpaintPipeline.create_pipeline(opt).to('cuda')
    # pipe = InpaintPipeline.create_modded_pipeline(opt).to('cuda')
    pipe = create_inpaint_pipeline(opt)

    generator = torch.Generator('cuda').manual_seed(opt.seed)
    idx_in_cf = 0
    for n in trange(opt.num_batches, desc="Batches"):
        if control.interrupt:
            break
        # create dummy mask
        mask = Image.new(
            'RGB', (opt.img['w_out'], opt.img['h_out']), (255, 255, 255))
        black_mask = Image.new(
            'RGB', (opt.img['w_out']//2, opt.img['h_out']), (0, 0, 0))
        mask.paste(black_mask, (0, 0))
        output = pipe(
            prompt=opt.prompt,
            strength=opt.strength,
            image=init_image,
            init_image=init_image,
            mask_image=mask,
            height=h_out,
            width=w_out,
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
    process_inpaint()
