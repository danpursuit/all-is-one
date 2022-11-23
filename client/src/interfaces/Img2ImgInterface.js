import { Button, Card, MenuItem, Select, Slider, Stack, TextField, Typography } from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import JobProgress from '../components/JobProgress';
import BatchOptionTextInput from '../components/BatchOptionTextInput';
import { REDO, UNDO, SUBMIT_START } from '../constants/actionTypes';
import BatchOptionSlider from '../components/BatchOptionSlider';
import BatchOptionSelect from '../components/BatchOptionSelect';
import schedulers from '../constants/schedulers';
import { WebSocketContext } from '../WebSocket';
import { img2imgOpts } from '../constants/options';
import Gallery from '../components/Gallery';
import Tips from '../components/Tips';
import { setTip } from '../actions';
import PromptHelp from '../components/PromptHelp';
import SubmitButt from '../components/SubmitButt';
import UndoRedo from '../components/UndoRedo';
import ImageUpload from '../components/ImageUpload';

const optNames = img2imgOpts;
const op = 'img2img';
const Img2ImgInterface = () => {
  const dispatch = useDispatch();
  const ws = React.useContext(WebSocketContext);
  const options = useSelector(state => state.main.options);
  const submitStatus = useSelector(state => state.main.submitStatus);
  const [info, setInfo] = React.useState({});
  useEffect(() => {
    const allOptionsReady = Object.keys(optNames).every(k => options[optNames[k]]);
    if (allOptionsReady) {
      const newInfo = {
        num_batches: options[optNames.num_batches].values[0],
        num_images_per_prompt: options[optNames.num_images_per_prompt].values[0],
        count_init_images: options[optNames.img].values.length,
        count_strength: options[optNames.strength].values.length,
        count_prompt: options[optNames.prompt].values.length,
        count_negative_prompt: options[optNames.negative_prompt].values.length,
        count_guidance_scale: options[optNames.guidance_scale].values.length,
        count_num_inference_steps: options[optNames.num_inference_steps].values.length,
        count_height: options[optNames.height].values.length,
        count_width: options[optNames.width].values.length,
        count_seed: options[optNames.seed].values.length,
        count_scheduler_class: options[optNames.scheduler_class].values.length,
      }
      newInfo.num_quick_images = newInfo.num_batches * newInfo.num_images_per_prompt;
      newInfo.num_procedural_batches = newInfo.count_init_images * newInfo.count_strength * newInfo.count_prompt * newInfo.count_negative_prompt * newInfo.count_guidance_scale * newInfo.count_num_inference_steps * newInfo.count_height * newInfo.count_width * newInfo.count_seed * newInfo.count_scheduler_class;
      newInfo.num_procedural_images = newInfo.num_procedural_batches * newInfo.num_quick_images;
      setInfo(newInfo);
    }
  }, [options])
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Stack spacing={2}>
          <ImageUpload name={optNames.img} />
          <BatchOptionTextInput name={optNames.prompt} label='Prompt' multiline rows={4} fullWidth />
          <BatchOptionTextInput name={optNames.negative_prompt} label='Negative Prompt' multiline rows={2} fullWidth />
          <BatchOptionSlider name={optNames.guidance_scale} label='Prompt Weight' defaultValue={6} min={1} max={20} step={0.5} />
          <BatchOptionSlider name={optNames.strength} label='Denoising Strength' defaultValue={0.4} min={0.1} max={1.0} step={0.01} />
          <BatchOptionSlider name={optNames.num_inference_steps} label='Inference Steps' defaultValue={20} min={1} max={150} step={1} />
          <Stack direction="row" spacing={2} justifyContent="space-evenly">
            <BatchOptionSlider name={optNames.height} label='Height' defaultValue={512} min={32} max={2048} step={32} />
            <BatchOptionSlider name={optNames.width} label='Width' defaultValue={512} min={32} max={2048} step={32} />
          </Stack>
        </Stack>
      </Grid>
      <Grid item xs={12} md={6}>
        <Stack spacing={2}>
          <Gallery op={op} optNames={optNames} />
          <SubmitButt info={info} ws={ws} op={op} options={options} optNames={optNames} submitStatus={submitStatus} />
          <SubmitButt info={info} ws={ws} op={op} options={options} optNames={optNames} submitStatus={submitStatus} isProcedural />
          <Stack direction="row" spacing={2}>
            <BatchOptionSlider name={optNames.num_batches} label='# Batches' defaultValue={1} min={1} max={16} step={1} useBatch={false} />
            <BatchOptionSlider name={optNames.num_images_per_prompt} label='Images per Batch' defaultValue={1} min={1} max={8} step={1} useBatch={false} />
          </Stack>
          <BatchOptionTextInput name={optNames.seed} label='Seed' defaultValue={-1} type='number' />
          <BatchOptionSelect name={optNames.scheduler_class} defaultValue={schedulers[0].key} items={schedulers} />
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <UndoRedo />
            <PromptHelp options={options} optNames={optNames} />
          </Stack>
          <Tips />
          <JobProgress submitStatus={submitStatus} />
        </Stack>
      </Grid>
    </Grid >
  )
}

export default Img2ImgInterface