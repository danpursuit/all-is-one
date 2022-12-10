
# from processors.img2img import process_img2img
# # from samplers.kdiff import KDiffSamplerWrap

# process_img2img()
from dotenv import load_dotenv
import os
import torch
from diffusers import DiffusionPipeline, AutoencoderKL, StableDiffusionPipeline
from PIL import Image
import opts

from scripts.utils import pil_to_bytes
from processors.editing import process_editing

img = Image.open('test.png')
im_bytes = pil_to_bytes(img)

process_editing({'img': {'img': im_bytes}})
