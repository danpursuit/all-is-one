import { Button, Card, MenuItem, Select, Slider, Stack, TextField, Typography } from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import JobProgress from '../components/JobProgress';
import BatchOptionTextInput from '../components/BatchOptionTextInput';
import { REDO, UNDO, SUBMIT_START, SET_MODEL } from '../constants/actionTypes';
import BatchOptionSlider from '../components/BatchOptionSlider';
import BatchOptionSelect from '../components/BatchOptionSelect';
import schedulers from '../constants/schedulers';
import { WebSocketContext } from '../WebSocket';
import { EMPTY_MODEL, IMG2IMG, SELECT_MODEL } from '../constants/features';
import DownloadModel, { ConvertModel, DownloadCustomModel } from '../components/DownloadModel';
import { ShowFolderButt } from '../components/GalleryButtons';

const op = SELECT_MODEL;
const SelectModelInterface = () => {
  const dispatch = useDispatch();
  const ws = React.useContext(WebSocketContext);
  const models = useSelector(state => state.main.models.models);
  const ckpts = useSelector(state => state.main.models.ckpts);
  const downloads = useSelector(state => state.main.models.downloads);
  const downloading = useSelector(state => state.main.models.downloading);
  useEffect(() => {
    if (models.regularChoice !== EMPTY_MODEL || models.inpaintingChoice !== EMPTY_MODEL || models.outpaintingChoice !== EMPTY_MODEL) {
      ws.saveModelChoices(models);
    }
  }, [models.regularChoice, models.inpaintingChoice, models.outpaintingChoice])
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Stack direction='column' spacing={1}>
          <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
            <Typography variant='h5'>Downloaded Models</Typography>
            <ShowFolderButt ws={ws} op='cache' />
          </Stack>
          <Stack direction='column' spacing={1} sx={{ backgroundColor: 'beige', borderRadius: 2, padding: 2, border: '1px solid black' }}>
            <Typography variant='h6'>Base Model</Typography>
            <Select value={models.regularChoice} onChange={(e) => dispatch({ type: SET_MODEL, payload: { regularChoice: e.target.value } })}>
              {models.regular !== null ? models.regular.map((m, i) => <MenuItem key={i} value={m}>{m}</MenuItem>) : <MenuItem value={EMPTY_MODEL}>Fetching...</MenuItem>}
            </Select>
            <Typography variant='body'>A base model must be selected to use AI1. It is used for Txt2Img, Img2Img, and Inpainting (if a specific inpainting model is not set).</Typography>
          </Stack>
          <Typography variant='h6'>Inpainting Model (optional)</Typography>
          <Select value={models.inpaintingChoice} onChange={(e) => dispatch({ type: SET_MODEL, payload: { inpaintingChoice: e.target.value } })}>
            {models.inpainting !== null ? models.inpainting.map((m, i) => <MenuItem key={i} value={m}>{m}</MenuItem>) : <MenuItem value={EMPTY_MODEL}>Fetching...</MenuItem>}
          </Select>
          <Typography variant='body'>A model trained for inpainting can be selected for better inpainting results. Do not simply add "-inpainting" to the file name of a base model; the architecture is fundamentally different.
            You can leave this empty to attempt a legacy inpainting method with the Base Model.</Typography>

          <Typography variant='h6'>Outpainting Model (optional)</Typography>
          <Select value={models.outpaintingChoice} onChange={(e) => dispatch({ type: SET_MODEL, payload: { outpaintingChoice: e.target.value } })}>
            {models.inpainting !== null ? models.inpainting.map((m, i) => <MenuItem key={i} value={m}>{m}</MenuItem>) : <MenuItem value={EMPTY_MODEL}>Fetching...</MenuItem>}
          </Select>
          <Typography variant='body'>Outpainting is a specialized form of inpainting that can extend an image beyond its original borders. Currently the only recommended outpainting model
            is the Stable Diffusion2's inpainting model.</Typography>

          <Button variant='contained' onClick={() => { ws.reqModelData(); }}>Refresh Local Files</Button>
        </Stack>
      </Grid>
      <Grid item xs={12} md={4}>
        <Stack direction='column' spacing={4}>
          <Stack direction='column' spacing={1}>
            <Typography variant='h5'>Available Downloads</Typography>
            <Stack direction='column' spacing={4}>
              {downloads && downloads.map((d, i) => <DownloadModel key={i} {...d} downloading={downloading} downloadFunc={(args) => { ws.downloadModel(args); }} availableModels={[...models.regular, ...models.inpainting]} />)}
            </Stack></Stack>
          <Stack direction='column' spacing={1}>
            <DownloadCustomModel downloading={downloading} ws={ws} availableModels={[...models.regular, ...models.inpainting]} />
            <Typography variant='body'>Model Names can be found at <a href='https://huggingface.co/models?other=stable-diffusion' target="_blank" rel="noopener noreferrer">https://huggingface.co/models?other=stable-diffusion</a></Typography>
          </Stack>
        </Stack>
      </Grid>
      <Grid item xs={12} md={4}>
        <Stack direction='column' spacing={1}>
          <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
            <Typography variant='h5'>Convert Checkpoints</Typography>
            <ShowFolderButt ws={ws} op='ckpt' />
          </Stack>
          <Typography variant='body'>Traditional models are stored as a single .ckpt file. To use this with AI1 (or any other application running HuggingFace's diffusers package),
            you must first convert the model. To do so, <span style={{ fontWeight: 'bold' }}>put your .ckpt file in the servers/models/ folder, click Refresh Local Files, and select it below.</span></Typography>
          <Typography variant='body'>There is no offical list of checkpoints, but community checkpoints can be found at <a href='https://rentry.org/sdmodels' target="_blank" rel="noopener noreferrer">https://rentry.org/sdmodels</a> (download at your discretion).</Typography>

          <ConvertModel ws={ws} downloading={downloading} availableModels={[...models.regular, ...models.inpainting]} ckpts={ckpts} />
        </Stack>
      </Grid>
    </Grid >
  )
}

export default SelectModelInterface