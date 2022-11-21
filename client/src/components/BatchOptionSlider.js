import { Box, Button, TextField, IconButton, Slider, Stack, Typography, getStepButtonUtilityClass } from '@mui/material'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { INIT_BATCH_OPTION, SET_BATCH_OPTION } from '../constants/actionTypes';
import BatchOptions from './BatchOptions';
const BatchOptionSlider = ({ name, defaultValue = 1, label, useBatch = true, ...args }) => {
    const dispatch = useDispatch();
    const [hovered, setHovered] = React.useState(false);
    // on startup, dispatch to initialize values
    useEffect(() => { dispatch({ type: INIT_BATCH_OPTION, payload: { name, values: [defaultValue], idx: 0 } }); })
    const data = useSelector(state => state.main.options[name]);
    const handleOptChange = (e, newValue) => { dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? newValue : v) } }) }
    return (
        <Box sx={{ display: 'inline-block', position: 'relative', flex: '1 1' }} onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}>
            {data && <>
                <Stack spacing={1}>
                    <Typography>{label}: {data.values[data.idx]}</Typography>
                    <Slider value={data.values[data.idx]} onChange={handleOptChange} {...args} />
                </Stack>
                {useBatch && (hovered || data.values.length > 1) && <BatchOptions data={data} defaultValue={defaultValue} />}</>}
        </Box>
    )
}

export default BatchOptionSlider