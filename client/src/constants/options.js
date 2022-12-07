export const txt2imgOpts = {
    prompt: 'txt2img-prompt',
    negative_prompt: 'txt2img-prompt-neg',
    guidance_scale: 'txt2img-prompt-weight',
    num_inference_steps: 'txt2img-inference-steps',
    height: 'txt2img-height',
    width: 'txt2img-width',
    num_batches: 'txt2img-num-batches',
    num_images_per_prompt: 'txt2img-im-per-batch',
    seed: 'txt2img-seed',
    scheduler_class: 'txt2img-scheduler',
}
export const txt2imgNames = Object.keys(txt2imgOpts);


export const img2imgOpts = {
    img: 'img2img-img',
    prompt: 'img2img-prompt',
    negative_prompt: 'img2img-prompt-neg',
    guidance_scale: 'img2img-prompt-weight',
    num_inference_steps: 'img2img-inference-steps',
    // height: 'img2img-height',
    // width: 'img2img-width',
    num_batches: 'img2img-num-batches',
    num_images_per_prompt: 'img2img-im-per-batch',
    seed: 'img2img-seed',
    scheduler_class: 'img2img-scheduler',
    strength: 'img2img-strength',
}
export const img2imgNames = Object.keys(img2imgOpts);

// values here should not be used right now. they are tied to img2img-img
export const imgSubOpts = {
    x_in: 'x_in',
    y_in: 'y_in',
    z_in: 'z_in',
    w_in: 'w_in',
    h_in: 'h_in',
    x_out: 'x_out',
    y_out: 'y_out',
    z_out: 'z_out',
    w_out: 'w_out',
    h_out: 'h_out',
    mask: 'mask',
    outpaint: 'outpaint',
}
export const imgSubNames = Object.keys(imgSubOpts);

export const imgSubDefaults = {
    x_in: () => 0,
    y_in: () => 0,
    z_in: ({ current }) => {
        return imgSubDefaults.w_out({ current }) / current.naturalWidth;
    },
    w_in: ({ current }) => current.naturalWidth,
    h_in: ({ current }) => current.naturalHeight,
    x_out: () => 0,
    y_out: () => 0,
    z_out: () => 1,
    w_out: ({ current }) => {
        if (current.naturalWidth > current.naturalHeight) {
            return Math.floor(Math.min(current.naturalWidth, 1024) / 32) * 32;
        } else {
            return Math.floor(imgSubDefaults.h_out({ current }) * current.naturalWidth / current.naturalHeight / 32) * 32;
        }
    },
    h_out: ({ current }) => {
        if (current.naturalWidth > current.naturalHeight) {
            return Math.floor(imgSubDefaults.w_out({ current }) * current.naturalHeight / current.naturalWidth / 32) * 32;
        } else {
            return Math.floor(Math.min(current.naturalHeight, 1024) / 32) * 32;
        }
    },
    mask: () => null,
    outpaint: () => false,
}
export const getImgSubDefaults = (imRef, old = null) => {
    const defaults = {};
    imgSubNames.forEach((subName, idx) => {
        defaults[subName] = imgSubDefaults[subName](imRef);
    })
    if (old && old.w_out & old.h_out) {
        // if dimensions match naturalWidth/height, keep old values
        if (old.w_out / old.h_out === imRef.current.naturalWidth / imRef.current.naturalHeight) {
            defaults.w_out = old.w_out;
            defaults.h_out = old.h_out;
            defaults.z_in = old.w_out / imRef.current.naturalWidth;
        }
    }
    if (old && old.mask) {
        defaults.mask = old.mask;
    }
    return defaults;
}