import os
import torch
from tqdm import trange
from pytorch_lightning import seed_everything

import opts
from pipelines.txt2img_pipeline import Txt2ImgPipeline
from output_manager import save_img


def process_txt2img(overrides=None, callback=None):
    opt = opts.set_opts(opts.global_opts, opts.txt2img_opts, overrides)

    pipe = Txt2ImgPipeline.create_pipeline(opt).to('cuda')
    # pipe.enable_sequential_cpu_offload()
    generator = torch.Generator('cuda').manual_seed(opt.seed)
    for n in trange(opt.num_batches, desc="Batches"):
        output = pipe(
            prompt=opt.prompt,
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
            img, meta, idx = save_img(img, opt, idx_in_batch)
            if callback:
                callback(img, meta, idx)
    opts.clear_opts()
    return output


if __name__ == "__main__":
    process_txt2img()
