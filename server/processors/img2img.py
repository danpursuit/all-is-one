import os
import torch
from tqdm import tqdm, trange
from pytorch_lightning import seed_everything
from PIL import Image

import opts
from pipelines.img2img_pipeline import Img2ImgPipeline
from scripts.utils import bytes_to_pil


def step_callback(step: int, timestep: int, latents: torch.FloatTensor):
    print(f"Step {step} Timestep {timestep} Latents {latents.shape}")


def process_img2img(overrides=None):
    opt = opts.set_opts(opts.global_opts, opts.img2img_opts, overrides)
    os.makedirs(opt.outpath, exist_ok=True)
    base_count = len(os.listdir(opt.outpath))

    if opt.img:
        init_image = bytes_to_pil(opt.img)
    else:
        init_image = Image.open(opt.imgpath).convert('RGB')
    # seed_everything(opt.seed)
    pipe = Img2ImgPipeline.create_pipeline(opt).to('cuda')

    generator = torch.Generator('cuda').manual_seed(opt.seed)
    for n in trange(opt.num_batches, desc="Sampling"):
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
        for img in output:
            img.save(os.path.join(
                opt.outpath, f"{base_count:05}.png"))
            base_count += 1
    opts.clear_opts()
    return output


if __name__ == "__main__":
    process_img2img()
