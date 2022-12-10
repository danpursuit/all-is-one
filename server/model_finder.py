import os
from dataclasses import dataclass
from diffusers import DiffusionPipeline, StableDiffusionUpscalePipeline
import torch

import opts
from constants import EMPTY_MODEL
from convert_checkpoint import convert_checkpoint

cache_path = os.path.join(os.path.dirname(__file__), 'cache')
ckpt_path = os.path.join(os.path.dirname(__file__), 'models')
editing_path = os.path.join(os.path.dirname(__file__), 'editing_cache')
for path in [cache_path, ckpt_path, editing_path]:
    os.makedirs(path, exist_ok=True)


def get_model_path(model_name):
    if model_name == EMPTY_MODEL:
        raise Exception(f'Cannot get model for {EMPTY_MODEL}')
    print('using model at path', os.path.join(cache_path, model_name)
          )
    return os.path.join(cache_path, model_name)


# def get_upscaler_choice():
#     dirs = [f for f in os.listdir(cache_path) if os.path.isdir(
#         os.path.join(cache_path, f))]
#     upscalers = [f for f in dirs if f.endswith('upscaler')]
#     return EMPTY_MODEL if len(upscalers) == 0 else upscalers[0]


def get_cache_models():
    dirs = [f for f in os.listdir(cache_path) if os.path.isdir(
        os.path.join(cache_path, f))]
    # print('opts', opts.global_opts)
    # upscalers = [f for f in dirs if f.endswith('upscaler')]
    return {
        'regular': [EMPTY_MODEL] + [f for f in dirs if not (f.endswith('inpainting') or f.endswith('upscaler'))],
        'inpainting': [EMPTY_MODEL] + [f for f in dirs if f.endswith('inpainting')],
        # 'upscalerChoice': get_upscaler_choice(),
        'regularChoice': opts.global_opts.regularChoice,
        'inpaintingChoice': opts.global_opts.inpaintingChoice,
        'outpaintingChoice': opts.global_opts.outpaintingChoice,
    }


def get_ckpts():
    return [EMPTY_MODEL] + [f for f in os.listdir(ckpt_path) if f.endswith('.ckpt')]

# create a dataclass called ModelDownload with the following fields:
# name: str
# url: str
# description: str


@dataclass
class ModelDownload:
    name: str
    save_name: str
    repo_id: str
    description: str

    def download(self):
        from dotenv import load_dotenv
        load_dotenv()
        if os.environ.get('HF_TOKEN', None) is None:
            print('hugging face token is required. set HF_TOKEN env var.')
            return
        print('Downloading model', self.name)
        # pipe_class = DiffusionPipeline if not self.repo_id.endswith(
        #     'upscaler') else StableDiffusionUpscalePipeline
        pipe_class = DiffusionPipeline
        try:
            pipe = pipe_class.from_pretrained(
                self.repo_id,
                torch_dtype=torch.float16,
                revision='fp16',
                use_auth_token=os.environ['HF_TOKEN'])
        except OSError:
            print('Error! Trying again without fp16 revision')
            pipe = pipe_class.from_pretrained(
                self.repo_id,
                torch_dtype=torch.float16,
                use_auth_token=os.environ['HF_TOKEN'])
        path = get_model_path(self.save_name)
        os.makedirs(path, exist_ok=True)
        print('Saving model to', path)
        pipe.save_pretrained(path)
        print('Done.')


downloads = [
    ModelDownload(
        name='SD2.1 - 512',
        save_name='sd2-1-512',
        repo_id="stabilityai/stable-diffusion-2-1-base",
        description='stabilityai/stable-diffusion-2-1-base: Stable Diffusion v2.1 model trained on 512x512 images. Good starting model.',
    ),
    ModelDownload(
        name='SD2 - 768',
        save_name='sd2-768',
        repo_id="stabilityai/stable-diffusion-2",
        description='stabilityai/stable-diffusion-2: Stable Diffusion v2 model trained on 768x768 images. For more powerful GPUs, this allows you to generate larger images with higher fidelity.',
    ),
    ModelDownload(
        name='SD2 - Inpainting',
        save_name='sd2-inpainting',
        repo_id="stabilityai/stable-diffusion-2-inpainting",
        description='stabilityai/stable-diffusion-2-inpainting: Stable Diffusion v2 model trained for inpainting and outpainting.',
    ),
    # ModelDownload(
    #     name='SD2 - Upscaler',
    #     save_name='sd2-upscaler',
    #     repo_id="stabilityai/stable-diffusion-x4-upscaler",
    #     description='Model specifically for upscaling. Download in order to use the upscaler.',
    # ),
]


def get_downloads():
    return [d.__dict__ for d in downloads]


def download_model(name):
    for d in downloads:
        if d.name == name:
            d.download()
            return True
    return False


def download_by_repo_id(save_name, repo_id):
    d = ModelDownload(
        name=save_name,
        save_name=save_name,
        repo_id=repo_id,
        description='Custom model',
    )
    d.download()


def convert_ckpt(save_name, ckpt_name, inpainting=False):
    pipe = convert_checkpoint(
        os.path.join(ckpt_path, ckpt_name),
        inpainting=inpainting,
    )
    path = get_model_path(save_name)
    print('Saving model to', path)
    pipe.save_pretrained(path)
    print('Done.')


def get_model_data(clear_download=False):
    res = {
        'models': get_cache_models(),
        'ckpts': get_ckpts(),
        'downloads': get_downloads(),
    }
    if clear_download:
        res['downloading'] = None
    return res
