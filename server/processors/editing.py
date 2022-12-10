import cv2
from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet
from basicsr.utils.download_util import load_file_from_url
from PIL import Image

import opts
import control
import model_finder as mf
from scripts.utils import bytes_to_cv2, cv2_to_pil, bytes_to_pil
from output_manager import save_img


def process_editing(overrides=None, callback=None, idx_in_job=0, cf_idx_in_job=0, job_size=0):
    opt = opts.set_opts(opts.global_opts, opts.editing_opts, overrides)
    img = bytes_to_cv2(opt.img['img'])

    netscale = 4 if opt.do_upscaling else 1

    # RealESRGAN_x4plus
    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64,
                    num_block=23, num_grow_ch=32, scale=4)
    url = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'
    model_path = load_file_from_url(
        url=url, model_dir=mf.editing_path, progress=True, file_name=None)
    upsampler = RealESRGANer(
        scale=netscale,
        model_path=model_path,
        dni_weight=None,
        model=model,
        tile=0,  # can try 32+
        tile_pad=10,
        pre_pad=0,
        half=True,
        gpu_id=None)

    if opt.face_res_pct > 0:
        print('restoring face', opt.face_res_pct)
        from gfpgan import GFPGANer
        face_enhancer = GFPGANer(
            model_path='https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.3.pth',
            upscale=netscale,
            arch='clean',
            channel_multiplier=2,
            bg_upsampler=upsampler)
        _, _, output = face_enhancer.enhance(
            img, has_aligned=False, only_center_face=False, paste_back=True)
        if opt.face_res_pct < 1:
            print('blending restored face with original')
            output_noface, _ = upsampler.enhance(img, outscale=netscale)
            output = cv2.addWeighted(
                output_noface, opt.face_res_pct, output_noface, 1 - opt.face_res_pct, 0)
    elif opt.do_upscaling:
        print('no face restoration')
        print('upsampling...')
        output, _ = upsampler.enhance(img, outscale=netscale)
    else:
        print('no upscaling')
        output = img

    img = cv2_to_pil(output)

    # if upscaling, handle the extra options
    if opt.do_upscaling:
        if opt.lanczos_mix > 0:
            print('mixing with lanczos')
            img_lanczos = bytes_to_pil(opt.img['img'])
            img_lanczos = img_lanczos.resize(
                (img.width, img.height), resample=Image.LANCZOS)
            img = Image.blend(img, img_lanczos, opt.lanczos_mix)

        # scale image dimensions if needed
        if img.height > opt.height or img.width > opt.width:
            print('upscaled image is bigger than original, resizing')
            img = img.resize((int(opt.width), int(
                opt.height)), resample=Image.LANCZOS)

    print('saving.')
    img, meta, idx = save_img(img, opt,
                              idx_in_cf=0,
                              idx_in_job=idx_in_job,
                              cf_idx_in_job=cf_idx_in_job,
                              job_size=job_size
                              )
    if callback:
        callback(img, meta, idx)
    opts.clear_opts()
    return [img]
