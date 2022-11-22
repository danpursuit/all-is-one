import { Box, Button, TextField, IconButton, Stack, Typography, getStepButtonUtilityClass } from '@mui/material'
import React, { useEffect } from 'react'
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import styles from './styles';
import { SET_BATCH_OPTION } from '../constants/actionTypes';
import { useDispatch } from 'react-redux';
import { PROCEDURAL } from '../constants/features';
import { setTip } from '../actions';

const BatchOptions = ({ data, defaultValue }) => {
    const dispatch = useDispatch();
    const addOpt = () => { dispatch({ type: SET_BATCH_OPTION, payload: { ...data, idx: data.values.length, values: [...data.values, defaultValue] } }) }
    const removeOpt = () => { dispatch({ type: SET_BATCH_OPTION, payload: { ...data, idx: Math.max(data.idx - 1, 0), values: data.values.filter((v, i) => i !== data.idx) } }) }
    const nextOpt = () => { dispatch({ type: SET_BATCH_OPTION, payload: { ...data, idx: Math.min(data.idx + 1, data.values.length - 1) } }) }
    const prevOpt = () => { dispatch({ type: SET_BATCH_OPTION, payload: { ...data, idx: Math.max(data.idx - 1, 0) } }) }
    return <Stack spacing={1} sx={{ position: 'absolute', top: 0, right: 0, m: 1 }}
        onMouseEnter={() => { dispatch(setTip(PROCEDURAL)) }}
    >
        <Stack direction='row' spacing={1} justifyContent='flex-end'>
            {data.values.length > 1 && <RemoveIcon sx={{ ...styles.overlayButton, ...(data.values.length <= 1 && styles.disabled) }} onClick={removeOpt} />}
            {data.values.length > 1 && <NavigateBeforeIcon sx={{ ...styles.overlayButton, ...(data.idx === 0 && styles.disabled) }} onClick={prevOpt} />}
            {data.values.length > 3 && <Typography>{data.idx + 1} / {data.values.length} </Typography>}
            {data.values.length > 1 && <NavigateNextIcon sx={{ ...styles.overlayButton, ...(data.idx === data.values.length - 1 && styles.disabled) }} onClick={nextOpt} />}
            <AddIcon sx={styles.overlayButton} onClick={addOpt} />
        </Stack>
    </Stack>
}

export default BatchOptions