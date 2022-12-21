
import { Card, Grid, CardContent, Fab, CardActionArea, Button, Typography, Box, Stack, Slider } from '@mui/material'
import React, { useEffect } from 'react'
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useDispatch, useSelector } from 'react-redux';
import { CLEAR_IMAGE, CONFIGURE, EMPTY_MODEL, RESET_IMAGE } from '../constants/features';
import { setTip } from '../actions';
const ImageUploadButtons = ({ target, clearImage, resetOptions, enableCanvas, advanced, editing = true }) => {
    const dispatch = useDispatch();
    const models = useSelector(state => state.main.models.models)
    const disabled = !target || !target.img;
    return (
        <Stack direction='column' spacing={1}>
            <Button variant='contained' size='small' onClick={clearImage} startIcon={<DeleteIcon />} disabled={disabled} onMouseEnter={() => dispatch(setTip(CLEAR_IMAGE))}>Clear</Button>
            {advanced && <Button variant='contained' size='small' onClick={resetOptions} startIcon={<RestartAltIcon />} disabled={disabled} onMouseEnter={() => dispatch(setTip(RESET_IMAGE))}>Reset</Button>}
            {!disabled && <>
                <Typography>Input: {`${target.w_in}x${target.h_in}`}</Typography>
                {advanced && <>
                    <Typography>Output: {`${target.w_out}x${target.h_out}`}</Typography>
                    {editing && <Typography>Inpainting: {target.mask !== null ?
                        ((target.outpaint && models.outpaintingChoice !== EMPTY_MODEL) ? models.outpaintingChoice :
                            (models.inpaintingChoice === EMPTY_MODEL ? 'LEGACY' : models.inpaintingChoice)) :
                        'No'}</Typography>}
                    {editing && <Typography>Outpainting: {target.outpaint ?
                        (models.outpaintingChoice === EMPTY_MODEL ? '(no model)' : models.outpaintingChoice) :
                        'No'}</Typography>}</>}
            </>}
            {advanced && <Button variant='contained' size='small' onClick={enableCanvas} disabled={disabled} onMouseEnter={() => dispatch(setTip(CONFIGURE))}>Configure</Button>}

            {/* <Button onClick={() => console.log(imRef.current.src)}>Here</Button> */}
            {/* <Button variant='contained' size='small' onClick={() => setEditInputs(!editInputs)} startIcon={<SwapHorizIcon />} disabled={disabled}>{editInputs ? 'output' : 'input'}</Button>
                {!editInputs && <Button variant='contained' size='small' onClick={syncOutput} disabled={disabled}>Match Input</Button>} */}
        </Stack>
    )
}

export default ImageUploadButtons;