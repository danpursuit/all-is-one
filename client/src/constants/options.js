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