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
    prompt: 'img2img-prompt',
    negative_prompt: 'img2img-prompt-neg',
    guidance_scale: 'img2img-prompt-weight',
    num_inference_steps: 'img2img-inference-steps',
    height: 'img2img-height',
    width: 'img2img-width',
    num_batches: 'img2img-num-batches',
    num_images_per_prompt: 'img2img-im-per-batch',
    seed: 'img2img-seed',
    scheduler_class: 'img2img-scheduler',
}
export const img2imgNames = Object.keys(img2imgOpts);