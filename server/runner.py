
# from processors.img2img import process_img2img
# # from samplers.kdiff import KDiffSamplerWrap

# process_img2img()
from dotenv import load_dotenv
import os
import torch
from diffusers import DiffusionPipeline, AutoencoderKL, StableDiffusionPipeline

import opts

from processors.txt2img import process_txt2img
from processors.img2img import process_img2img


process_txt2img()
process_txt2img({'guidance_scale': 2.})
process_txt2img({'guidance_scale': 6.})
process_txt2img({'guidance_scale': 10.})
# # iterate over all four types
# for scheduler_class in ['euler', 'euler_ancestral', 'lms', 'pndm']:
#     print(f'Processing {scheduler_class}')
#     process_txt2img({'scheduler_class': scheduler_class})

# process_img2img()
# # iterate over three types, lms doing weird stuff
# for scheduler_class in ['euler', 'euler_ancestral', 'pndm']:
#     print(f'Processing {scheduler_class}')
#     process_img2img({'scheduler_class': scheduler_class})
