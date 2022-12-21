import { Box, Typography } from '@mui/material';
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { DELETE_BATCH, DELETE_SINGLE_IMAGE, REDO, SET_BATCH_OPTION, SET_BATCH_OPTIONS, UNDO } from '../constants/actionTypes';
import { SHOW_FOLDER, CONFIRM_DELETE, CONFIRM_DELETE_BATCH, MIRROR, PROCEDURAL, SEND_TO_IMG2IMG, SHOW_BATCH, KEYFRAME, CONFIGURE, RESET_IMAGE, CLEAR_IMAGE, GALLERY_DISPLAY, GALLERY_NAVIGATION, PROMPT_HELP } from '../constants/features';
import { txt2imgOpts, img2imgOpts, editingOpts, img2vidOpts } from '../constants/options';

const styles = {
    outer: {
        padding: 1,
        border: '1px solid #ccc',
        borderRadius: 2,
        minHeight: '4.2em',
    }
}

const descriptions = {
    [PROMPT_HELP]: ['Prompt Help:', 'Click to browse useful prompt tokens to add to prompt or negative prompt.'],
    [GALLERY_NAVIGATION]: ['Gallery:', 'Use the arrows to browse, or type in a number to jump to a specific image.'],
    [GALLERY_DISPLAY]: ['Gallery:', 'Displaying the images/videos that have been generated already. Use the buttons below to copy settings, navigate, open the containing folder, and more.'],
    [CLEAR_IMAGE]: ['Clear Image:', 'Clear the image.'],
    [RESET_IMAGE]: ['Reset Image Settings:', 'Restore the image settings to default values.'],
    [CONFIGURE]: ['Configure Image:', 'Crop or scale the initial image, and set the dimensions of the output. For Image2Image, also configure inpainting/outpainting settings.'],
    [KEYFRAME]: ['New Keyframe:', 'Add multiple settings at different frame numbers. The video generated will interpolate between the settings. To use a constant value, use only one value with the frame number set to 0.'],
    [SHOW_FOLDER]: ['Show Folder:', 'Open the containing folder in your file explorer.'],
    [SEND_TO_IMG2IMG]: ['Send Image:', 'Send the selected image to the Image2Image or Editing interface.'],
    [DELETE_SINGLE_IMAGE]: ['Delete Image:', 'Click twice to delete the image.'],
    [DELETE_BATCH]: ['Delete Job', 'Click twice to delete the entire job (batch delete).'],
    [CONFIRM_DELETE]: ['CONFIRM DELETE SINGLE:', 'Click Delete to confirm deletion of the single image.'],
    [CONFIRM_DELETE_BATCH]: ['CONFIRM DELETE JOB:', 'Click Delete to confirm deletion of the batch of images.'],
    [SHOW_BATCH]: ['Job Display:', 'Display all images from the current job. If Copy Settings is enabled, settings for the entire job will be copied over.'],
    [MIRROR]: ['Copy Settings:', 'When enabled, will copy the [settings used to generate the current displayed image] to your workstation.'],
    [PROCEDURAL]: ['Procedural Generation:', 'Submit multiple jobs at the same time by adding more settings with the + button. PROCEDURAL SUBMIT will submit a job for every combination of settings. For example, 3 different prompts + 2 different prompt weights will create 3 x 2 = 6 jobs.'],
    [txt2imgOpts.prompt]: ['Prompt:', 'A description of the image you want to generate. Separate tokens with a comma, i.e.: "digital painting of a sunset by the beach, palm tree, sailboat, 80s vibe, claude monet".'],
    [txt2imgOpts.negative_prompt]: ['Negative Prompt:', 'Characteristics of the image that you do not want to see. For a realistic portrait, i.e.: "amateur, poorly drawn, cartoon, weird colors, bad hands"'],
    [txt2imgOpts.guidance_scale]: ['Prompt Weight:', 'How closely the image should match the prompt. Lower weight → more creativity, higher weight → more deterministic. Values that are too high may "fry" the image. Also known as CFG scale \(Classifier Free Guidance\).'],
    [txt2imgOpts.num_inference_steps]: ['Inference Steps:', 'The number of steps to take when generating the image. More steps → more detailed image, but longer generation time. Typically, 20 - 40 steps is sufficient.'],
    [txt2imgOpts.height]: ['Width x Height:', 'The resolution of the image in pixels. The shape of the image can influence quality of results, i.e. 384x544 can make better portraits whereas 512x384 can make better landscapes. 512x512 is the default, and it is recommended to avoid images too much larger. Instead, generate a smaller image and upscale the result.'],
    [txt2imgOpts.num_batches]: ['Number of Batches:', 'The number of batches to generate. Images generated = (Number of Batches) x (Images per Batch).'],
    [txt2imgOpts.num_images_per_prompt]: ['Images per Batch:', 'The number of images to generate per batch. For smaller GPUs, leave this number at 1 and instead increase Number of Batches. Images generated = (Number of Batches) x (Images per Batch).'],
    [txt2imgOpts.seed]: ['Seed:', 'A number to control the randomness of the image generation. The same seed can be used between runs to generate the same image while varying other options. Use -1 for a random seed.'],
    [txt2imgOpts.scheduler_class]: ['Scheduler:', 'The algorithm to use for applying inference at each step. Different schedulers can have different optimal Prompt Weight and Inference Steps. Try using procedural generation to see the effects of different settings!'],
    [img2imgOpts.img]: ['Initial Image:', 'The initial image to use for image generation. Click to upload/remove image, or drag and drop an image. You can also directly drag generated images from the gallery on the right!'],
    [img2imgOpts.strength]: ['Denoising Strength:', 'How far the algorithm can stray from the initial image. Values of 0.3-0.5 are good for making small changes to an image. At higher Denoising Strength, it is recommended to increase Prompt Weight if the algorithm is too random. For non-legacy inpainting, denoising strength is not used.'],
    [editingOpts.face_res_pct]: ['Face Restoration:', 'Set to 0 to disable. When enabled, GFPGAN face restoration will be applied to the image before upscaling (if enabled), then blended into the original image at the percentage specified (1.0 for full restoration).'],
    [editingOpts.do_upscaling]: ['Upscaling:', 'When enabled, the image will be upscaled to the resolution specified in Width x Height using ESRGAN.'],
    [editingOpts.height]: ['Width x Height:', 'The resolution of the output image. Upscaling must be enabled.'],
    [editingOpts.lanczos_mix]: ['Lanczos Blending:', 'Lanczos Sampling is an older upscaling algorithm that may better match the original image, at the cost of not recognizing "lines", "surfaces", and other details. If the ESRGAN upsampled image is coming out too smooth, adding Lanczos blending in can restore some of the texture.'],
    [img2vidOpts.prompt_kf]: ['Prompt:', 'A description of the current frame. Frame numbers after this frame and before the next specified prompt will use the same prompt.'],
    [img2vidOpts.negative_prompt_kf]: ['Negative Prompt:', 'Negative prompt for the current frame. Frame numbers after this frame and before the next specified prompt will use the same negative prompt.'],
    [img2vidOpts.guidance_scale_kf]: ['Prompt Weight:', 'Prompt weight for the current frame. Values will be interpolated between frames using Interpolation Type.'],
    [img2vidOpts.strength_kf]: ['Denoising Strength:', 'Denoising strength for the current frame. Values will be interpolated between frames using Interpolation Type.'],
    [img2vidOpts.num_inference_steps_kf]: ['Inference Steps:', 'Number of inference steps for the current frame. Values will be interpolated between frames using Interpolation Type.'],
    [img2vidOpts.noise_kf]: ['Noise to add:', 'Amount of noise to add to the last frame before using it to generate the next frame. Values will be interpolated between frames using Interpolation Type.'],
    [img2vidOpts.angle_kf]: ['Rotation:', 'How much the image will rotate each frame, in degrees. Values will be interpolated between frames using Interpolation Type.'],
    [img2vidOpts.zoom_kf]: ['Zoom:', 'How much the image will zoom in/out each frame. Values will be interpolated between frames using Interpolation Type.'],
    [img2vidOpts.tx_kf]: ['Translate:', 'How much the image will move in the X direction each frame. Values will be interpolated between frames using Interpolation Type.'],
    [img2vidOpts.ty_kf]: ['Translate:', 'How much the image will move in the Y direction each frame. Values will be interpolated between frames using Interpolation Type.'],
    [img2vidOpts.seed_behavior]: ['Seed Behavior:', 'How the seed is changed each frame.'],
    [img2vidOpts.seed]: ['Seed:', 'The seed for the first frame. -1 to randomize. Seed will change via the Seed Behavior setting.'],
    [img2vidOpts.num_frames]: ['Number of Frames:', 'The number of frames to generate.'],
    [img2vidOpts.frame_rate]: ['Frame Rate:', 'How many frames per second the video will use.'],
    [img2vidOpts.img]: ['Initial Image:', 'The initial image to use for image generation.'],
    [img2vidOpts.interp_spline]: ['Interpolation Type:', 'How numerical values change from one frame to the next. Linear: linearly interpolate between every pair of consecutive values. Quadratic/Cubic: values interpolate using a quadratic/cubic function fitted to all values'],
}
descriptions[txt2imgOpts.width] = descriptions[txt2imgOpts.height];
descriptions[editingOpts.width] = descriptions[editingOpts.height];
Object.keys(img2imgOpts).forEach(k => {
    if (txt2imgOpts[k] && !descriptions[img2imgOpts[k]]) {
        descriptions[img2imgOpts[k]] = descriptions[txt2imgOpts[k]];
    }
});
Object.keys(img2vidOpts).forEach(k => {
    if (img2imgOpts[k] && !descriptions[img2vidOpts[k]]) {
        descriptions[img2vidOpts[k]] = descriptions[img2imgOpts[k]];
    }
});
Object.keys(editingOpts).forEach(k => {
    if (img2imgOpts[k] && !descriptions[editingOpts[k]]) {
        descriptions[editingOpts[k]] = descriptions[img2imgOpts[k]];
    }
});
const getDescription = (name, main) => {
    if (name === UNDO) {
        if (main.historyIndex <= -1) return 'Undo the last action.';
        switch (main.history[main.historyIndex].type) {
            case SET_BATCH_OPTION:
                if (!descriptions[main.history[main.historyIndex].prevState.name]) {
                    console.log('need tip', main.history[main.historyIndex].prevState.name);
                }
                return 'Undo the last change to ' + descriptions[main.history[main.historyIndex].prevState.name][0].replace(':', '') + '.';
            case SET_BATCH_OPTIONS:
                return 'Undo the last Copy Settings.';
            default:
                return 'Undo the last action.';
        }
    }
    if (name === REDO) {
        if (main.historyIndex >= main.history.length - 1) return 'Redo the last action.';
        switch (main.history[main.historyIndex + 1].type) {
            case SET_BATCH_OPTION:
                return 'Redo the last change to ' + descriptions[main.history[main.historyIndex + 1].nextState.name][0].replace(':', '') + '.';
            case SET_BATCH_OPTIONS:
                return 'Redo the last Copy Settings.';
            default:
                return 'Redo the last action.';
        }
    }
    if (descriptions[name]) {
        return descriptions[name].map((v, i) => i === 0 ? <strong key={i}>{v} </strong> : <span key={i}>{v}</span>)
    }
    return descriptions[name] || name;
}

const Tips = () => {
    const tipName = useSelector(state => state.tips.name);
    const main = useSelector(state => state.main);
    return (
        <Box sx={styles.outer}>
            <Typography variant='body2'>
                {getDescription(tipName, main)}</Typography>
        </Box>
    )
}

export default Tips