import numpy as np
import torch
import PIL
from PIL import Image, ImageOps
from packaging import version
import io
import base64
from diffusers.configuration_utils import FrozenDict
import cv2

from scripts.g_diffuser import get_matched_noise

try:
    SAMPLING_MODE = Image.Resampling.LANCZOS
except Exception as e:
    SAMPLING_MODE = Image.LANCZOS

if version.parse(version.parse(PIL.__version__).base_version) >= version.parse("9.1.0"):
    PIL_INTERPOLATION = {
        "linear": Image.Resampling.BILINEAR,
        "bilinear": Image.Resampling.BILINEAR,
        "bicubic": Image.Resampling.BICUBIC,
        "lanczos": Image.Resampling.LANCZOS,
        "nearest": Image.Resampling.NEAREST,
    }
else:
    PIL_INTERPOLATION = {
        "linear": Image.LINEAR,
        "bilinear": Image.BILINEAR,
        "bicubic": Image.BICUBIC,
        "lanczos": Image.LANCZOS,
        "nearest": Image.NEAREST,
    }


def scale_image(img, z_in):
    """scale image to z_in"""
    return ImageOps.scale(img, z_in, resample=SAMPLING_MODE).convert("RGB")


def fit_image(img, x_in, y_in, x_out, y_out, w_out, h_out, fill=None):
    """paste image into output size, shifted by parameters"""
    in_coord = (x_in - img.width/2, y_in - img.height/2)
    out_coord = (x_out - w_out/2, y_out - h_out/2)
    # positive margin means there is white space
    margins = {
        'left': int(in_coord[0] - out_coord[0]),
        'top': int(in_coord[1] - out_coord[1]),
        'right': int(out_coord[0] + w_out - in_coord[0] - img.width),
        'bottom': int(out_coord[1] + h_out - in_coord[1] - img.height)
    }
    if fill:
        out_img = Image.new('RGB', (w_out, h_out), fill)
    else:
        out_img = Image.new('RGB', (w_out, h_out))
    out_img.paste(
        img, (int(in_coord[0] - out_coord[0]), int(in_coord[1] - out_coord[1])))
    return out_img, margins


def mk_blur(img, mask, noise_q=1, color_variation=0.05):
    np_image = (np.asarray(img) / 255.0).astype(np.float64)
    np_mask = (np.asarray(mask) / 255.0).astype(np.float64)
    noised = get_matched_noise(np_image, np_mask, noise_q, color_variation)
    return Image.fromarray(np.clip(noised * 255., 0., 255.).astype(np.uint8), mode="RGB")


def prepare_mask_and_masked_image(image, mask):
    # used in old pipeline
    image = np.array(image.convert("RGB"))
    image = image[None].transpose(0, 3, 1, 2)
    image = torch.from_numpy(image).to(dtype=torch.float32) / 127.5 - 1.0

    mask = np.array(mask.convert("L"))
    mask = mask.astype(np.float32) / 255.0
    mask = mask[None, None]
    mask[mask < 0.5] = 0
    mask[mask >= 0.5] = 1
    mask = torch.from_numpy(mask)

    masked_image = image * (mask < 0.5)

    return mask, masked_image


def prep_client_mask(mask_str):
    # create image with mask
    # flip black to white and all other colors to black
    orig_mask = bytes_to_pil(mask_str)
    mask_data = []
    for color in orig_mask.getdata():
        if color[-1] > 0:
            mask_data.append((255, 255, 255))
        else:
            mask_data.append((0, 0, 0))
    mask = Image.new(orig_mask.mode, orig_mask.size)
    mask.putdata(mask_data)
    return mask


def merge_masks(m1: Image, m2: Image):
    """Create a mask that is the union of the two masks
    black+black = black
    black+white = white
    white+white = white
    """
    m1_data = m1.convert('RGB').getdata()
    m2_data = m2.convert('RGB').getdata()
    merged_data = []
    m1c = {}
    m2c = {}
    for i in range(len(m1_data)):
        if m1_data[i] not in m1c:
            m1c[m1_data[i]] = 0
        m1c[m1_data[i]] += 1
        if m2_data[i] not in m2c:
            m2c[m2_data[i]] = 0
        m2c[m2_data[i]] += 1
        if m1_data[i][-1] > 0 or m2_data[i][-1] > 0:
            merged_data.append((255, 255, 255))
        else:
            merged_data.append((0, 0, 0))
    merged = Image.new(m1.mode, m1.size)
    merged.putdata(merged_data)
    print(f'm1 colors: {m1c}')
    print(f'm2 colors: {m2c}')
    # m1 colors: {(0, 0, 0, 255): 260633, (255, 255, 255, 255): 132583}
    # m2 colors: {(255, 255, 255): 144384, (0, 0, 0): 248832}
    return merged


def prep_outpaint_mask(original_img, opt, mask_blur=16):
    x_in = opt.img['x_in']
    y_in = opt.img['y_in']
    z_in = opt.img['z_in']
    x_out = opt.img['x_out']
    y_out = opt.img['y_out']
    w_out = opt.img['w_out']
    h_out = opt.img['h_out']
    img, margins = fit_image(original_img, x_in, y_in, x_out,
                             y_out, w_out, h_out, fill=None)
    mask_blur = 16
    # create new size with mask_blur
    assert mask_blur * \
        2 < original_img.width, f'Image {original_img.size} is too small for mask_blur {mask_blur}'
    blur_width = original_img.width - (mask_blur if margins['left'] > 0 else 0) - \
        (mask_blur if margins['right'] > 0 else 0)
    blur_height = original_img.height - (mask_blur if margins['top'] > 0 else 0) - \
        (mask_blur if margins['bottom'] > 0 else 0)
    original_mask = Image.new("RGB", (blur_width, blur_height), "black")

    # if you remove from the right, you need to shift left by half of what is removed
    mask, mask_margins = fit_image(
        original_mask,
        x_in - (mask_blur//2 if margins['right'] > 0 else 0) +
        (mask_blur//2 if margins['left'] > 0 else 0),
        y_in - (mask_blur//2 if margins['bottom'] > 0 else 0) +
        (mask_blur//2 if margins['top'] > 0 else 0),
        x_out,
        y_out, w_out, h_out, fill="white")

    # this may be unnecessary
    blurred_image = mk_blur(img, mask)

    return blurred_image, mask


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


def bytes_to_cv2(image_bytestr, trim=True):
    """
    Convert a byte array to a cv2 image.
    """
    if trim:
        image_bytestr = image_bytestr.split(';')[1].split(',')[1]
    return cv2.imdecode(np.frombuffer(base64.b64decode(image_bytestr), np.uint8), cv2.IMREAD_COLOR)


def cv2_to_pil(cv2_image):
    """
    Convert a cv2 image to a PIL image.
    """
    return Image.fromarray(cv2.cvtColor(cv2_image, cv2.COLOR_BGR2RGB))


def prepare_scheduler(scheduler):
    if hasattr(scheduler.config, "steps_offset") and scheduler.config.steps_offset != 1:
        new_config = dict(scheduler.config)
        new_config['steps_offset'] = 1
        scheduler._internal_dict = FrozenDict(new_config)
    return scheduler
