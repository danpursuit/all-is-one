import os
import torch
from tqdm import tqdm, trange
from pytorch_lightning import seed_everything
from PIL import Image

import opts
import control
from pipelines.pipe_wrapper import create_img2img_pipeline, create_inpaint_pipeline, create_outpaint_pipeline, create_upscaler_pipeline
from scripts.utils import bytes_to_pil, fit_image, scale_image, prep_client_mask, merge_masks, prep_outpaint_mask
from output_manager import save_img
from constants import EMPTY_MODEL


def step_callback(step: int, timestep: int, latents: torch.FloatTensor):
    print(f"Step {step} Timestep {timestep} Latents {latents.shape}")


def process_img2img(overrides=None, callback=None, idx_in_job=0, cf_idx_in_job=0, job_size=0):
    opt = opts.set_opts(opts.global_opts, opts.img2img_opts, overrides)
    x_in = opt.img['x_in']
    y_in = opt.img['y_in']
    z_in = opt.img['z_in']
    x_out = opt.img['x_out']
    y_out = opt.img['y_out']
    w_out = opt.img['w_out']
    h_out = opt.img['h_out']

    original_img = scale_image(bytes_to_pil(opt.img['img']), z_in)
    inpaint_mask = opt.img['mask']
    outpaint = opt.img['outpaint']
    if outpaint and opt.outpaintingChoice == EMPTY_MODEL:
        print('Disabling outpainting because no outpaint model was selected')
        outpaint = False

    if outpaint:
        init_image, outpaint_mask = prep_outpaint_mask(original_img, opt)
    else:
        init_image, margins = fit_image(original_img, x_in, y_in, x_out,
                                        y_out, w_out, h_out, fill=None)
        outpaint_mask = None

    # create final mask
    extra_args = {}
    # extra_args = dict(
    #     mask_image=mask,)
    # height=h_out,
    # width=w_out,
    if inpaint_mask:
        inpaint_mask = prep_client_mask(inpaint_mask)
        old = opt.inpaintingChoice == EMPTY_MODEL
        print('img2img inpainting:', 'legacy' if old else 'fine-tuned')
        if outpaint_mask:
            print('img2img also outpainting')
            extra_args['mask_image'] = merge_masks(inpaint_mask, outpaint_mask)
            pipe = create_outpaint_pipeline(opt)
        else:
            print('inpainting only')
            extra_args['mask_image'] = inpaint_mask
            pipe = create_inpaint_pipeline(opt, old=old)
    elif outpaint_mask:
        print('img2img outpainting only')
        extra_args['mask_image'] = outpaint_mask
        pipe = create_outpaint_pipeline(opt)
    else:
        print('img2img inpainting/outpainting: false')
        pipe = create_img2img_pipeline(opt)
        extra_args['strength'] = opt.strength

    generator = torch.Generator(opt.device).manual_seed(opt.seed)
    idx_in_cf = 0
    for n in trange(opt.num_batches, desc="Batches"):
        if control.interrupt:
            break
        output = pipe(
            prompt=opt.prompt,
            image=init_image,
            num_inference_steps=opt.num_inference_steps,
            guidance_scale=opt.guidance_scale,
            negative_prompt=opt.negative_prompt,
            num_images_per_prompt=opt.num_images_per_prompt,
            generator=generator,
            **extra_args,
            # callback=step_callback,
            # callback_steps=1,
        )
        # below is for upscaler (when implemented)
        # output = pipe(
        #     prompt=opt.prompt,
        #     # strength=opt.strength,
        #     image=init_image,
        #     # init_image=init_image,
        #     # mask_image=mask,
        #     # height=h_out,
        #     # width=w_out,
        #     num_inference_steps=opt.num_inference_steps,
        #     guidance_scale=opt.guidance_scale,
        #     negative_prompt=opt.negative_prompt,
        #     num_images_per_prompt=opt.num_images_per_prompt,
        #     generator=generator,
        # )
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
