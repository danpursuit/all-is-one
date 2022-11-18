from PIL import Image
import numpy as np
import torch
import PIL.Image
import PIL.ImageOps
from packaging import version
import io
import base64
if version.parse(version.parse(PIL.__version__).base_version) >= version.parse("9.1.0"):
    PIL_INTERPOLATION = {
        "linear": PIL.Image.Resampling.BILINEAR,
        "bilinear": PIL.Image.Resampling.BILINEAR,
        "bicubic": PIL.Image.Resampling.BICUBIC,
        "lanczos": PIL.Image.Resampling.LANCZOS,
        "nearest": PIL.Image.Resampling.NEAREST,
    }
else:
    PIL_INTERPOLATION = {
        "linear": PIL.Image.LINEAR,
        "bilinear": PIL.Image.BILINEAR,
        "bicubic": PIL.Image.BICUBIC,
        "lanczos": PIL.Image.LANCZOS,
        "nearest": PIL.Image.NEAREST,
    }


def numpy_to_pil(images):
    """
    Convert a numpy image or a batch of images to a PIL image.
    """
    if images.ndim == 3:
        images = images[None, ...]
    images = (images * 255).round().astype("uint8")
    if images.shape[-1] == 1:
        # special case for grayscale (single channel) images
        pil_images = [Image.fromarray(image.squeeze(), mode="L")
                      for image in images]
    else:
        pil_images = [Image.fromarray(image) for image in images]

    return pil_images


def preprocess(image):
    w, h = image.size
    # resize to integer multiple of 32
    w, h = map(lambda x: x - x % 32, (w, h))
    image = image.resize((w, h), resample=PIL_INTERPOLATION["lanczos"])
    image = np.array(image).astype(np.float32) / 255.0
    image = image[None].transpose(0, 3, 1, 2)
    image = torch.from_numpy(image)
    return 2.0 * image - 1.0


def pil_to_bytes(pil_image):
    """
    Convert a PIL image to a byte array.
    """
    with io.BytesIO() as buffer:
        pil_image.save(buffer, format="PNG")
        contents = buffer.getvalue()
    return base64.b64encode(contents).decode("utf-8")


def bytes_to_pil(image_bytestr, trim=True):
    """
    Convert a byte array to a PIL image.
    """
    if trim:
        image_bytestr = image_bytestr.split(';')[1].split(',')[1]
    return Image.open(io.BytesIO(base64.b64decode(image_bytestr)))
