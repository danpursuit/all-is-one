import { Box, Button, Card, MenuItem, Select, Slider, Stack, TextField, Typography } from '@mui/material'
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
import { img2vidOpts } from '../constants/options';
import Gallery from '../components/Gallery';
import Tips from '../components/Tips';
import { setTip } from '../actions';
import PromptHelp from '../components/PromptHelp';
import SubmitButt from '../components/SubmitButt';
import UndoRedo from '../components/UndoRedo';
import ImageUpload from '../components/ImageUpload';
import { IMG2VID } from '../constants/features';
import { interps, seedBehaviors } from '../constants/videoConstants';
import KeyframeTextInput from '../components/KeyframeTextInput';
import KeyframeSlider from '../components/KeyframeSlider';

const optNames = img2vidOpts;
const op = IMG2VID;
const fpsMarks = [1, 2, 10, 24, 30, 60, 120].map(x => ({ value: x, label: x.toString() }));
const Img2VidInterface = () => {
  const dispatch = useDispatch();
  const ws = React.useContext(WebSocketContext);
  const options = useSelector(state => state.main.options);
  const submitStatus = useSelector(state => state.main.submitStatus);
  const [info, setInfo] = React.useState({ num_quick_images: 1 });

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Stack spacing={5}>
          <ImageUpload name={optNames.img} advanced={true} op={op} useBatch={false} editing={false} />
          <KeyframeTextInput name={optNames.prompt_kf} label='Prompt' multiline rows={4} fullWidth />
          <KeyframeTextInput name={optNames.negative_prompt_kf} label='Negative Prompt' multiline rows={2} fullWidth />
          <KeyframeSlider name={optNames.guidance_scale_kf} label='Prompt Weight' defaultValue={8} min={1} max={20} step={0.5} />
          <KeyframeSlider name={optNames.strength_kf} label='Denoising Strength' defaultValue={0.4} min={0.1} max={1.0} step={0.01} />
          <KeyframeSlider name={optNames.num_inference_steps_kf} label='Inference Steps' defaultValue={20} min={1} max={150} step={1} />
          <KeyframeSlider name={optNames.noise_kf} label='Noise (per frame)' defaultValue={0.08} min={0.0} max={0.2} step={0.01} />
        </Stack>
      </Grid>
      <Grid item xs={12} md={6}>
        <Stack spacing={2}>
          <Gallery op={op} optNames={optNames} isVideo />
          <SubmitButt info={info} ws={ws} op={op} options={options} optNames={optNames} submitStatus={submitStatus} keyframes />

          <Stack direction='row' spacing={2} alignItems='center'>
            <BatchOptionTextInput name={optNames.num_frames} label='Total Frames' type='number' defaultValue={30} useBatch={false} containerSx={{ marginTop: 4 }} />
            <BatchOptionSlider name={optNames.frame_rate} label='FPS' defaultValue={24} min={1} max={120} step={null} useBatch={false} marks={fpsMarks} />
          </Stack>
          <Stack direction='row' spacing={2} alignItems='center'>
            <KeyframeSlider name={optNames.angle_kf} label='Angle' defaultValue={0} min={-5} max={5} step={0.5} />
            <KeyframeSlider name={optNames.zoom_kf} label='Zoom' defaultValue={1} min={0.75} max={1.25} step={0.01} />
          </Stack>
          <Stack direction='row' spacing={2} alignItems='center'>
            <KeyframeSlider name={optNames.tx_kf} label='Translate (x)' defaultValue={0} min={-10} max={10} step={1} />
            <KeyframeSlider name={optNames.ty_kf} label='Translate (y)' defaultValue={0} min={-10} max={10} step={1} />
          </Stack>
          <Stack direction='row' spacing={2} alignItems='center'>
            <BatchOptionTextInput name={optNames.seed} label='Seed' defaultValue={-1} type='number' useBatch={false} containerSx={{ marginBottom: 3 }} />
            <BatchOptionSelect title='Seed Behavior' name={optNames.seed_behavior} defaultValue={seedBehaviors[0].key} items={seedBehaviors} useBatch={false} />
          </Stack>
          <Stack direction='row' spacing={2} alignItems='center'>
            <BatchOptionSelect title='Scheduler' name={optNames.scheduler_class} defaultValue={schedulers[0].key} items={schedulers} useBatch={false} />
            <BatchOptionSelect title='Interpolation Type' name={optNames.interp_spline} defaultValue={interps[0].key} items={interps} />
          </Stack>
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <PromptHelp options={options} optNames={optNames} isKf />
            <UndoRedo />
          </Stack>
          <Tips />
          <JobProgress submitStatus={submitStatus} />
        </Stack>
      </Grid>
    </Grid >
  )
}

export default Img2VidInterface