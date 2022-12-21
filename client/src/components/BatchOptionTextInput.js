import { Box, Button, TextField, IconButton, Stack, Typography, getStepButtonUtilityClass } from '@mui/material'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { INIT_BATCH_OPTION, SET_BATCH_OPTION } from '../constants/actionTypes';
import { setTip } from '../actions';
import BatchOptions from './BatchOptions';

const BatchOptionTextInput = ({ name, defaultValue = '', useBatch = true, containerSx = null, ...args }) => {
    const dispatch = useDispatch();
    const [hovered, setHovered] = React.useState(false);
    // on startup, dispatch to initialize values
    useEffect(() => { dispatch({ type: INIT_BATCH_OPTION, payload: { name, values: [defaultValue], idx: 0 } }); })
    const data = useSelector(state => state.main.options[name]);
    const handleOptChange = (e) => {
        let val = e.target.value;
        if (args.type === 'number') {
            if (val.toString() === '') {
                val = -1;
            } else {
                val = parseFloat(val);
            }
        }
        dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? val : v) } })
    }
    return (
        <Box sx={{ display: 'inline-block', position: 'relative', ...containerSx }} onMouseEnter={() => { dispatch(setTip(name)); setHovered(true) }}
            onMouseLeave={() => setHovered(false)}>
            {data && <>
                <TextField value={data.values[data.idx]} onChange={handleOptChange} {...args} />
                {useBatch && (hovered || data.values.length > 1) && <BatchOptions data={data} defaultValue={defaultValue} />}</>}
        </Box>
    )
}

export default BatchOptionTextInput