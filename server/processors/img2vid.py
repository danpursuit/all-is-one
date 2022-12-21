import os
import torch
from tqdm import tqdm, trange
from pytorch_lightning import seed_everything
from PIL import Image
import cv2
import math

import opts
import control
from pipelines.pipe_wrapper import create_img2img_pipeline, create_inpaint_pipeline, create_outpaint_pipeline, create_upscaler_pipeline
from scripts.utils import tensor_to_pil, pil_to_tensor, bytes_to_pil, fit_image, scale_image, prep_client_mask, merge_masks, prep_outpaint_mask
import scripts.deforum as deforum
from output_manager import save_img2vid_img, get_op_path, create_video
from constants import EMPTY_MODEL


def step_callback(step: int, timestep: int, latents: torch.FloatTensor):
    print(f"Step {step} Timestep {timestep} Latents {latents.shape}")


def process_img2vid(overrides=None, callback=None, idx_in_job=0, cf_idx_in_job=0, job_size=0):
    opt = opts.set_opts(opts.global_opts, opts.img2vid_opts, overrides)
    # folder should already be created by server
    num_folders = len(os.listdir(get_op_path(opt.context))) - 1
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

    pipe = create_img2img_pipeline(opt)

    # create animation configs

    prompt_series = deforum.get_series(opt, opt.prompt_kf)
    negative_prompt_series = deforum.get_series(opt, opt.negative_prompt_kf)
    guidance_scale_series = deforum.get_inbetweens(opt, opt.guidance_scale_kf)
    strength_series = deforum.get_inbetweens(opt, opt.strength_kf)
    num_inference_steps_series = deforum.get_inbetweens(
        opt, opt.num_inference_steps_kf)
    noise_series = deforum.get_inbetweens(opt, opt.noise_kf)
    angles, zooms, txs, tys = deforum.get_keyframe_data(opt)
    prev_sample = None
    color_match_sample = None
    seed = opt.seed
    for frame_idx in range(opt.num_frames):
        print('frame', frame_idx+1, 'of', opt.num_frames)
        if control.interrupt:
            break
        if prev_sample is not None:
            angle = angles[frame_idx]
            zoom = zooms[frame_idx]
            tx = txs[frame_idx]
            ty = tys[frame_idx]
            print('angle', angle, 'zoom', zoom, 'tx', tx, 'ty', ty)
            noised_sample, color_match_sample = deforum.create_noised_sample(
                opt, prev_sample, color_match_sample, angle, zoom, tx, ty, frame_idx, noise_series[frame_idx])
            init_sample = tensor_to_pil(noised_sample)
        else:
            init_sample = init_image
        generator = torch.Generator(opt.device).manual_seed(seed)
        strength = strength_series[frame_idx]
        if strength * num_inference_steps_series[frame_idx] < 1:
            print('increasing strength because number of inference steps is too low')
            strength = math.ceil(
                1 / num_inference_steps_series[frame_idx] * 100) / 100
        params = dict(
            prompt=prompt_series[frame_idx],
            strength=strength,
            image=init_sample,
            num_inference_steps=num_inference_steps_series[frame_idx],
            guidance_scale=guidance_scale_series[frame_idx],
            negative_prompt=negative_prompt_series[frame_idx],
        )
        print(params)
        output = pipe(
            prompt=prompt_series[frame_idx],
            strength=strength,
            image=init_sample,
            num_inference_steps=int(num_inference_steps_series[frame_idx]),
            guidance_scale=guidance_scale_series[frame_idx],
            negative_prompt=negative_prompt_series[frame_idx],
            num_images_per_prompt=1,
            generator=generator
        )
        prev_sample = pil_to_tensor(output[0])
        img, idx = save_img2vid_img(output[0], opt, num_folders)
        seed = deforum.next_seed(opt, seed)
        if callback:
            callback(img, dict(), idx)
    opts.clear_opts()
    create_video(opt, num_folders)
    return output


if __name__ == "__main__":
    process_img2vid()
