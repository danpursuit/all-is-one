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
import { EMPTY_MODEL, IMG2IMG, SELECT_MODEL, TIPS_AND_TRICKS } from '../constants/features';
import DownloadModel, { ConvertModel, DownloadCustomModel } from '../components/DownloadModel';
import { ShowFolderButt } from '../components/GalleryButtons';

const op = TIPS_AND_TRICKS;
const fastFacts = [
  {
    title: `Beginner Tips`,
    facts: [
      'Prompt and Model are the most important settings for generating images. If your images look bad, try searching for what prompts others use specifically for that model. Or, look for a model fine-tuned in the subject you are generating.',
      'Denoising Strength and Sampling Steps both increase your image generation time substantially. While all ranges of denoising strength have uses, Sampling Steps usually caps out around 20-50 steps, depending on the sampler. One exception is in inpainting.'
    ]
  },
  {
    title: 'Schedulers',
    facts: [
      'To generate an image from txt2img or img2img, noise is added to the generation so that the model can "denoise" the image to match the prompt. Schedulers influence how this denoising happens, each with its own characteristics. You are encouraged to experiment with them to discover your favorite!',
      'DPM is the recommended starting scheduler, as it is the fastest.',
      'Euler Ancestral leads to more randomness than Euler.',
      'The optimal strength and sampling steps for each scheduler is different.',
    ]
  },
  {
    title: 'Inpainting',
    facts: [
      'Legacy inpainting can be a great way to use a fine-tuned model that was not trained for inpainting. Sampling Steps of 80+ is recommended.',
      'Stable Diffusion2 can perform inpainting and outpainting very well. Install the model from the model select page!'
    ]
  }
]
const TipsAndTricksInterface = () => {
  return (
    <Stack spacing={2} justifyContent='center' alignItems='center'>
      {fastFacts.map(({ title, facts }, i) => (
        <Card key={i} sx={{ p: 2, maxWidth: '800px' }} elevation={4}>
          <Typography variant="h5">{title}</Typography>
          <br />
          <Stack spacing={1}>
            {facts.map((fact, j) => (
              <Typography key={j} variant="body1">‣ {fact}</Typography>
            ))}
          </Stack>
        </Card>
      ))}
    </Stack>
  )
}

export default TipsAndTricksInterface