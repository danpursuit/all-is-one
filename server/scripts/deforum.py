import numpy as np
import pandas as pd
import cv2
import torch
import random
from einops import rearrange, repeat
from skimage.exposure import match_histograms

# https://github.com/lmmx/deforum-stable-diffusion/blob/master/src/deforum_video

interp_methods = ["Linear", "Quadratic", "Cubic"]


def sample_to_cv2(sample: torch.Tensor) -> np.ndarray:
    sample_f32 = rearrange(sample.squeeze().cpu().numpy(), "c h w -> h w c").astype(
        np.float32
    )
    sample_f32 = ((sample_f32 * 0.5) + 0.5).clip(0, 1)
    sample_int8 = (sample_f32 * 255).astype(np.uint8)
    return sample_int8


def make_xform_2d(width, height, translation_x, translation_y, angle, scale):
    center = (height // 2, width // 2)
    trans_mat = np.float32([[1, 0, translation_x], [0, 1, translation_y]])
    rot_mat = cv2.getRotationMatrix2D(center, angle, scale)
    trans_mat = np.vstack([trans_mat, [0, 0, 1]])
    rot_mat = np.vstack([rot_mat, [0, 0, 1]])
    return np.matmul(rot_mat, trans_mat)


def get_keyframe_data(opt):
    angles = get_inbetweens(opt, opt.angle_kf)
    zooms = get_inbetweens(opt, opt.zoom_kf)
    txs = get_inbetweens(opt, opt.tx_kf)
    tys = get_inbetweens(opt, opt.ty_kf)
    return angles, zooms, txs, tys


def get_inbetweens(opt, key_frames, integer=False):
    key_frame_series = pd.Series([np.nan for a in range(opt.num_frames)])

    for i, value in key_frames.items():
        key_frame_series[i] = value
    key_frame_series = key_frame_series.astype(float)

    interp_method = opt.interp_spline
    assert interp_method in interp_methods
    if interp_method == "Cubic" and len(key_frames.items()) <= 3:
        interp_method = "Quadratic"
    if interp_method == "Quadratic" and len(key_frames.items()) <= 2:
        interp_method = "Linear"

    key_frame_series[0] = key_frame_series[key_frame_series.first_valid_index()]
    key_frame_series[opt.num_frames - 1] = key_frame_series[
        key_frame_series.last_valid_index()
    ]
    key_frame_series = key_frame_series.interpolate(
        method=interp_method.lower(), limit_direction="both"
    )
    return key_frame_series.astype(int) if integer else key_frame_series


def maintain_colors(prev_img, color_match_sample, hsv=False):
    if hsv:
        prev_img_hsv = cv2.cvtColor(prev_img, cv2.COLOR_RGB2HSV)
        color_match_hsv = cv2.cvtColor(color_match_sample, cv2.COLOR_RGB2HSV)
        matched_hsv = match_histograms(
            prev_img_hsv, color_match_hsv, multichannel=True)
        return cv2.cvtColor(matched_hsv, cv2.COLOR_HSV2RGB)
    else:
        return match_histograms(prev_img, color_match_sample, multichannel=True)


def add_noise(sample: torch.Tensor, noise_amt: float):
    return sample + torch.randn(sample.shape, device=sample.device) * noise_amt


def sample_from_cv2(sample: np.ndarray) -> torch.Tensor:
    sample = ((sample.astype(float) / 255.0) * 2) - 1
    sample = sample[None].transpose(0, 3, 1, 2).astype(np.float16)
    sample = torch.from_numpy(sample)
    return sample

# the actual function used in img2vid, a combination of deforum utilities


def create_noised_sample(opt, prev_sample, color_match_sample, angle, zoom, tx, ty, frame_idx, noise):
    w_out = opt.img['w_out']
    h_out = opt.img['h_out']
    xform = make_xform_2d(w_out, h_out, tx, ty, angle, zoom)
    prev_img = sample_to_cv2(prev_sample)
    prev_img = cv2.warpPerspective(
        prev_img, xform, (w_out, h_out),
        borderMode=cv2.BORDER_WRAP if opt.wrap_border else cv2.BORDER_REPLICATE,
    )
    if color_match_sample is None:
        color_match_sample = prev_img.copy()
    else:
        prev_img = maintain_colors(
            prev_img, color_match_sample, hsv=(frame_idx % 2 == 0))
    noised_sample = add_noise(sample_from_cv2(prev_img), noise)
    return noised_sample, color_match_sample


def get_series(opt, key_frames):
    # similar to get_inbetweens, but no interpolation (i.e. for strings)
    new_series = pd.Series([np.nan for a in range(opt.num_frames)])
    for i, j in key_frames.items():
        new_series[i] = j
    new_series = new_series.ffill().bfill()
    return new_series


def next_seed(opt, seed):
    if opt.seed_behavior == 'iter':
        return seed + 1
    elif opt.seed_behavior == 'fixed':
        return opt.seed
    elif opt.seed_behavior == 'random':
        return random.randint(0, 2**32)
    raise ValueError('Invalid seed behavior: {}'.format(opt.seed_behavior))
