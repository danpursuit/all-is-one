from dotenv import load_dotenv
import os
import torch
from diffusers import DiffusionPipeline, AutoencoderKL, StableDiffusionPipeline, StableDiffusionInpaintPipeline

import opts

# After running setup.bat, this script will continue setup
load_dotenv()

# download sd2
path = 'cache/sd2_512'
os.makedirs(path, exist_ok=True)
repo_id = "stabilityai/stable-diffusion-2-base"
pipe = DiffusionPipeline.from_pretrained(
    repo_id, torch_dtype=torch.float16, revision='fp16', use_auth_token=os.environ['HF_TOKEN'])
pipe.save_pretrained(path)
# path = 'cache/sd2_768'
# os.makedirs(path, exist_ok=True)
# repo_id = "stabilityai/stable-diffusion-2"
# pipe = DiffusionPipeline.from_pretrained(
#     repo_id, torch_dtype=torch.float16, revision='fp16', use_auth_token=os.environ['HF_TOKEN'])
# pipe.save_pretrained(path)
# path = 'cache/sd2_inpainting'
# os.makedirs(path, exist_ok=True)
# repo_id = "stabilityai/stable-diffusion-2-inpainting"
# pipe = DiffusionPipeline.from_pretrained(
#     repo_id, torch_dtype=torch.float16, revision='fp16', use_auth_token=os.environ['HF_TOKEN'])
# pipe.save_pretrained(path)
