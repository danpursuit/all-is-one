import os
import torch
from tqdm import trange
from pytorch_lightning import seed_everything

import opts
from pipelines.txt2img_pipeline import Txt2ImgPipeline


def process_txt2img(overrides=None):
    opt = opts.set_opts(opts.global_opts, opts.txt2img_opts, overrides)
    os.makedirs(opt.outpath, exist_ok=True)
    base_count = len(os.listdir(opt.outpath))

    pipe = Txt2ImgPipeline.create_pipeline(opt).to('cuda')
    # pipe.enable_sequential_cpu_offload()
    generator = torch.Generator('cuda').manual_seed(opt.seed)
    for n in trange(opt.num_batches, desc="Sampling"):
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
        for img in output:
            img.save(os.path.join(
                opt.outpath, f"{base_count:05}.png"))
            base_count += 1
    opts.clear_opts()
    return output


if __name__ == "__main__":
    process_txt2img()
