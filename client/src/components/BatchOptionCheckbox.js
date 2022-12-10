import { Box, Button, TextField, IconButton, Slider, Stack, Typography, getStepButtonUtilityClass, Checkbox } from '@mui/material'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setTip } from '../actions';
import { INIT_BATCH_OPTION, SET_BATCH_OPTION } from '../constants/actionTypes';
import BatchOptions from './BatchOptions';
const BatchOptionCheckbox = ({ name, defaultValue = false, label, useBatch = true, ...args }) => {
    const dispatch = useDispatch();
    const [hovered, setHovered] = React.useState(false);
    // on startup, dispatch to initialize values
    useEffect(() => { dispatch({ type: INIT_BATCH_OPTION, payload: { name, values: [defaultValue], idx: 0 } }); })
    const data = useSelector(state => state.main.options[name]);
    const handleOptChange = (e) => { dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? e.target.checked : v) } }) }
    return (
        <Box sx={{ display: 'inline-block', position: 'relative', flex: '1 1' }} onMouseEnter={() => { dispatch(setTip(name)); setHovered(true) }}
            onMouseLeave={() => setHovered(false)}>
            {data && <>
                <Stack direction="row" spacing={1} justifyContent="left" alignItems="center">
                    <Typography>{label}</Typography>
                    <Checkbox checked={data.values[data.idx]} onChange={handleOptChange} {...args} />
                </Stack>
                {useBatch && (hovered || data.values.length > 1) && <BatchOptions data={data} defaultValue={defaultValue} />}
            </>}
        </Box>
    )
}

export default BatchOptionCheckbox