import os
import torch
from tqdm import tqdm, trange
from pytorch_lightning import seed_everything
from PIL import Image
import numpy as np

import opts
import control
from pipelines.pipe_wrapper import create_inpaint_pipeline, create_img2img_pipeline, create_outpaint_pipeline
from scripts.utils import merge_masks, bytes_to_pil, fit_image, scale_image, prep_client_mask, prep_outpaint_mask
from output_manager import save_img
from diffusers import StableDiffusionInpaintPipeline


def process_outpaint(overrides=None, callback=None, idx_in_job=0, cf_idx_in_job=0, job_size=0):
    opt = opts.set_opts(opts.global_opts, opts.img2img_opts, overrides)
    x_in = opt.img['x_in']
    y_in = opt.img['y_in']
    z_in = opt.img['z_in']
    x_out = opt.img['x_out']
    y_out = opt.img['y_out']
    w_out = opt.img['w_out']
    h_out = opt.img['h_out']
    if opt.img:
        original_img = scale_image(bytes_to_pil(opt.img['img']), z_in)
        blurred_image, outpaint_mask = prep_outpaint_mask(original_img, opt)

        inpaint_mask = opt.img['mask']
        if inpaint_mask:
            inpaint_mask = prep_client_mask(inpaint_mask)
            mask = merge_masks(inpaint_mask, outpaint_mask)
        else:
            mask = outpaint_mask

        # todo: get the mask from opt.img['mask']
        # prep_client_mask()
        # merge with this outpaintmask--white+black->white

        # blurred_image = img
    else:
        raise ValueError("No image provided")
    # seed_everything(opt.seed)

    # pipe = InpaintPipeline.create_pipeline(opt).to('cuda')
    # pipe = InpaintPipeline.create_modded_pipeline(opt).to('cuda')
    pipe = create_outpaint_pipeline(opt)
    # pipe = create_img2img_pipeline(opt)

    generator = torch.Generator('cuda').manual_seed(opt.seed)
    idx_in_cf = 0
    for n in trange(opt.num_batches, desc="Batches"):
        if control.interrupt:
            break
        output = pipe(
            prompt=opt.prompt,
            strength=opt.strength,
            init_image=blurred_image,
            image=blurred_image,
            mask_image=mask,
            height=h_out,
            width=w_out,
            num_inference_steps=opt.num_inference_steps,
            guidance_scale=opt.guidance_scale,
            negative_prompt=opt.negative_prompt,
            num_images_per_prompt=opt.num_images_per_prompt,
            generator=generator,
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
    process_outpaint()
