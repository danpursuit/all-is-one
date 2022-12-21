import { Box, Button, TextField, IconButton, Stack, Typography, getStepButtonUtilityClass } from '@mui/material'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { INIT_BATCH_OPTION, SET_BATCH_OPTION } from '../constants/actionTypes';
import { setTip } from '../actions';
import Keyframer from './Keyframer';

const KeyframeTextInput = ({ name, defaultValue = '', useBatch = true, ...args }) => {
    const dispatch = useDispatch();
    const [hovered, setHovered] = React.useState(false);
    // on startup, dispatch to initialize values
    useEffect(() => { dispatch({ type: INIT_BATCH_OPTION, payload: { name, values: [{ frame: 0, value: defaultValue }], idx: 0 } }); })
    const data = useSelector(state => state.main.options[name]);
    const handleOptChange = (e) => {
        let value = e.target.value;
        if (args.type === 'number') {
            if (value.toString() === '') {
                value = -1;
            } else {
                value = parseFloat(value);
            }
        }
        dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? { ...v, value } : v) } })
    }
    const handleKeyframeChange = (e) => {
        let frame = e.target.value;
        frame = parseInt(frame);
        dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? { ...v, frame } : v) } })
    }
    return (
        <Box sx={{ display: 'inline-block', position: 'relative' }} onMouseEnter={() => { dispatch(setTip(name)); setHovered(true) }}
            onMouseLeave={() => setHovered(false)}>
            {data && <>
                <Box sx={{ width: '70%' }}>
                    <TextField value={data.values[data.idx].value} onChange={handleOptChange} {...args} /></Box>
                {useBatch && (hovered || data.values.length > 1) && <Keyframer data={data} handleKeyframeChange={handleKeyframeChange} />}</>}
        </Box>
    )
}

export default KeyframeTextInput