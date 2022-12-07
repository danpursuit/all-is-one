import { Box, Button, TextField, MenuItem, IconButton, Stack, Typography, getStepButtonUtilityClass, Select, Checkbox } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress';
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setTip } from '../actions';
import { INIT_BATCH_OPTION, SET_BATCH_OPTION } from '../constants/actionTypes';
import BatchOptions from './BatchOptions';
import CheckIcon from '@mui/icons-material/Check';
import { EMPTY_MODEL } from '../constants/features';

const DownloadModel = ({ name, save_name, description, availableModels, downloadFunc, downloading }) => {
    const alreadyDownloaded = availableModels.filter(model => model === save_name).length > 0;
    return (
        <Stack direction='column' spacing={1}>
            <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
                <Typography>{name}</Typography>
                <Button variant='contained' onClick={() => downloadFunc({ name })}
                    disabled={alreadyDownloaded || downloading !== null}
                    size='small'
                    endIcon={alreadyDownloaded ? <CheckIcon /> : (downloading === name ? <CircularProgress size={20} /> : null)}>
                    {alreadyDownloaded ? 'Installed' : (
                        downloading === name ? 'Downloading' : 'Download'
                    )}
                </Button>
            </Stack>
            <Typography variant='body'>{description}</Typography>
            <Typography variant='body'>Will be saved as {save_name}.</Typography>
        </Stack>
    )
}

export default DownloadModel

export const DownloadCustomModel = ({ ws, downloading, availableModels }) => {
    const [data, setData] = React.useState({
        saveName: '',
        repoId: '',
    })
    const alreadyDownloaded = availableModels.filter(model => model === data.saveName).length > 0;
    return (
        <Stack direction='column' spacing={1}>
            <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
                <Typography>Other HuggingFace Model</Typography>
                <Button variant='contained' onClick={() => ws.downloadByRepoId(data)}
                    disabled={!data.saveName || !data.repoId || alreadyDownloaded || downloading !== null}
                    size='small'
                    endIcon={downloading === data.saveName ? <CircularProgress size={20} /> : null}>
                    {alreadyDownloaded ? 'Name Exists' : (
                        downloading === data.saveName ? 'Downloading' : 'Download'
                    )}
                </Button>
            </Stack>
            <TextField label='Remote model name (i.e. CompVis/stable-diffusion-v1-4)' variant='outlined'
                value={data.repoId} onChange={e => setData({ ...data, repoId: e.target.value })} />
            <TextField label='Local save name (i.e. sdv1-4)' variant='outlined'
                value={data.saveName} onChange={e => setData({ ...data, saveName: e.target.value })} />
            {/* <Typography variant='body'>{description}</Typography>
            <Typography variant='body'>Will be saved as {save_name}.</Typography> */}
        </Stack >
    )
}

export const ConvertModel = ({ ws, downloading, availableModels, ckpts }) => {
    const [data, setData] = React.useState({
        saveName: '',
        ckptName: EMPTY_MODEL,
        inpainting: false,
    })
    const alreadyDownloaded = availableModels.filter(model => model === data.saveName).length > 0;
    return (
        <Stack direction='column' spacing={1}>
            <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
                <Typography>Convert a .ckpt file</Typography>
                <Button variant='contained' onClick={() => ws.convertCkpt(data)}
                    disabled={!data.saveName || data.ckptName === EMPTY_MODEL || alreadyDownloaded || downloading !== null}
                    size='small'
                    endIcon={downloading === data.saveName ? <CircularProgress size={20} /> : null}>
                    {alreadyDownloaded ? 'Name Exists' : (
                        downloading === data.saveName ? 'Converting' : 'Convert'
                    )}
                </Button>
            </Stack>
            <Select value={data.ckptName} onChange={(e) => setData({ ...data, ckptName: e.target.value })}>
                {ckpts !== null ? ckpts.map((m, i) => <MenuItem key={i} value={m}>{m}</MenuItem>) : <MenuItem value={EMPTY_MODEL}>Fetching...</MenuItem>}
            </Select>
            <TextField label='Local save name (no file extension required)' variant='outlined'
                value={data.saveName} onChange={e => setData({ ...data, saveName: e.target.value })} />
            <Stack direction='row' alignItems='center'>
                <Typography>Model trained for Inpainting?</Typography>
                <Checkbox checked={data.inpainting} onChange={(e) => {
                    // if saveName does not end in '-inpainting', add it
                    if (e.target.checked && !data.saveName.endsWith('-inpainting')) {
                        setData({ ...data, saveName: data.saveName + '-inpainting', inpainting: e.target.checked })
                    } else if (!e.target.checked && data.saveName.endsWith('-inpainting')) {
                        setData({ ...data, saveName: data.saveName.slice(0, -11), inpainting: e.target.checked })
                    } else {
                        setData({ ...data, inpainting: e.target.checked })
                    }
                }} /></Stack>
            {/* <Typography variant='body'>{description}</Typography>
            <Typography variant='body'>Will be saved as {save_name}.</Typography> */}
        </Stack >
    )
}