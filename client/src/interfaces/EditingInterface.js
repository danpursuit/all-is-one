import { Button, Card, MenuItem, Select, Slider, Stack, TextField, Typography } from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import JobProgress from '../components/JobProgress';
import BatchOptionTextInput from '../components/BatchOptionTextInput';
import { REDO, UNDO, SUBMIT_START, SET_BATCH_OPTION, SET_BATCH_OPTIONS } from '../constants/actionTypes';
import BatchOptionSlider from '../components/BatchOptionSlider';
import BatchOptionSelect from '../components/BatchOptionSelect';
import schedulers from '../constants/schedulers';
import { WebSocketContext } from '../WebSocket';
import { editingOpts } from '../constants/options';
import Gallery from '../components/Gallery';
import Tips from '../components/Tips';
import { setTip } from '../actions';
import PromptHelp from '../components/PromptHelp';
import SubmitButt from '../components/SubmitButt';
import UndoRedo from '../components/UndoRedo';
import ImageUpload from '../components/ImageUpload';
import { EDITING, IMG2IMG } from '../constants/features';
import BatchOptionCheckbox from '../components/BatchOptionCheckbox';

const optNames = editingOpts;
const op = EDITING;
const EditingInterface = () => {
  const dispatch = useDispatch();
  const ws = React.useContext(WebSocketContext);
  const options = useSelector(state => state.main.options);
  const submitStatus = useSelector(state => state.main.submitStatus);
  const [info, setInfo] = React.useState({});
  const currentImg = options[optNames.img]?.values[options[optNames.img].idx];
  const [currentData, setCurrentData] = React.useState({
    ready: false
  });
  const [scale, setScale] = React.useState(1);
  useEffect(() => {
    if (currentImg) {
      setCurrentData({
        width: currentImg.w_in,
        height: currentImg.h_in,
        ready: true
      })
    } else {
      setCurrentData({ ready: false });
    }
  }, [currentImg])
  useEffect(() => {
    const allOptionsReady = Object.keys(optNames).every(k => options[optNames[k]]);
    if (allOptionsReady) {
      const newInfo = {
        num_batches: 1,
        num_images_per_prompt: 1,
        // count_init_images: options[optNames.img].values.length,
        // count_strength: options[optNames.strength].values.length,
        // count_prompt: options[optNames.prompt].values.length,
        // count_negative_prompt: options[optNames.negative_prompt].values.length,
        // count_guidance_scale: options[optNames.guidance_scale].values.length,
        // count_num_inference_steps: options[optNames.num_inference_steps].values.length,
        // count_seed: options[optNames.seed].values.length,
        // count_scheduler_class: options[optNames.scheduler_class].values.length,
      }
      newInfo.num_quick_images = newInfo.num_batches * newInfo.num_images_per_prompt;
      newInfo.num_procedural_batches = 1;
      newInfo.num_procedural_images = 1;
      // newInfo.num_procedural_batches = newInfo.count_init_images * newInfo.count_strength * newInfo.count_prompt * newInfo.count_negative_prompt * newInfo.count_guidance_scale * newInfo.count_num_inference_steps * newInfo.count_seed * newInfo.count_scheduler_class;
      // newInfo.num_procedural_images = newInfo.num_procedural_batches * newInfo.num_quick_images;
      setInfo(newInfo);
    }
  }, [options])
  useEffect(() => {
    if (!canUpscale()) return;
    const newHeight = Math.round(currentData.height * scale);
    const newWidth = Math.round(currentData.width * scale);
    const newOptions = {
      [optNames.height]: { ...options[optNames.height], values: options[optNames.height].values.map((v, i) => i === options[optNames.height].idx ? newHeight : v) },
      [optNames.width]: { ...options[optNames.width], values: options[optNames.width].values.map((v, i) => i === options[optNames.width].idx ? newWidth : v) },
    }
    dispatch({ type: SET_BATCH_OPTIONS, payload: { options: newOptions, type: 'scaleImage' } });
  }, [scale])
  const handleScaleChange = (e, newValue) => {
    setScale(newValue);
    // let data = options[optNames.height];
    // dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? newHeight : v) } })
    // data = options[optNames.width];
    // dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? newWidth : v) } })
  }
  const canUpscale = () => {
    return currentData.ready && options[optNames.do_upscaling].values[options[optNames.do_upscaling].idx];
  }
  const scaleSliderColor = () => {
    // if width and height match, then use green
    if (currentData.ready && options[optNames.width].values[options[optNames.width].idx] === Math.round(currentData.width * scale) && options[optNames.height].values[options[optNames.height].idx] === Math.round(currentData.height * scale)) {
      return 'success';
    }
    return 'info'
    // otherwise secondary
  }
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Stack spacing={2}>
          <ImageUpload name={optNames.img} advanced={false} />
          <BatchOptionSlider name={optNames.face_res_pct} label='Face Restoration' defaultValue={0} min={0} max={1.0} step={0.05} />
          <BatchOptionCheckbox name={optNames.do_upscaling} label='Upscale?' defaultValue={false} useBatch={false} />
          <Stack spacing={1} direction='column'>
            <Typography sx={{ color: canUpscale() ? 'black' : 'gray' }}>Sync Dimensions: {scale}x</Typography>
            <Slider value={scale} onChange={handleScaleChange} min={0.5} max={4.0} step={0.05} disabled={!canUpscale()} color={scaleSliderColor()} />
          </Stack>
          <Stack direction="row" spacing={2} justifyContent="left">
            <BatchOptionTextInput name={optNames.width} label='Output Width' defaultValue={512} type='number' useBatch={false} disabled={!canUpscale()} />
            <BatchOptionTextInput name={optNames.height} label='Output Height' defaultValue={512} type='number' useBatch={false} disabled={!canUpscale()} />
          </Stack>
          <BatchOptionSlider name={optNames.lanczos_mix} label='Lanczos Blending' defaultValue={0} min={0} max={1.0} step={0.05} disabled={!canUpscale()} />
        </Stack>
      </Grid>
      <Grid item xs={12} md={6}>
        <Stack spacing={2}>
          <Gallery op={op} optNames={optNames} />
          <SubmitButt info={info} ws={ws} op={op} options={options} optNames={optNames} submitStatus={submitStatus} noPrompt />
          <SubmitButt info={info} ws={ws} op={op} options={options} optNames={optNames} submitStatus={submitStatus} noPrompt isProcedural />
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <UndoRedo />
          </Stack>
          <Tips />
          <JobProgress submitStatus={submitStatus} />
        </Stack>
      </Grid>
    </Grid >
  )
}

export default EditingInterface