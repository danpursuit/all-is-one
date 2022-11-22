from dotenv import load_dotenv
import os
import torch
from diffusers import DiffusionPipeline, AutoencoderKL, StableDiffusionPipeline

import opts

# After running setup.bat, this script will continue setup
load_dotenv()

# download the default model
os.makedirs(opts.global_opts.model_cache_path, exist_ok=True)
print('downloading base 1.4 model')
pipe = StableDiffusionPipeline.from_pretrained(
    'CompVis/stable-diffusion-v1-4',
    torch_dtype=opts.global_opts.dtype,
    use_auth_token=os.environ['HF_TOKEN'],
)
print('saving to', opts.global_opts.model_cache_path)
pipe.save_pretrained(opts.global_opts.model_cache_path)

# download the codeformer face restoration model
os.makedirs(opts.global_opts.face_res_cache_path, exist_ok=True)
print('downloading face restoration model')



# below is a way to create your own fine tuned model from a ckpt file
# python scripts/sd_to_diffusers.py --checkpoint_path models/model.ckpt --original_config_file models/v1-inference.yaml --scheduler_type ddim --dump_path cache/converted_model
