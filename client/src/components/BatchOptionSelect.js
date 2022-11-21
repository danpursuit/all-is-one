import { Box, Button, TextField, MenuItem, IconButton, Stack, Typography, getStepButtonUtilityClass, Select } from '@mui/material'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { INIT_BATCH_OPTION, SET_BATCH_OPTION } from '../constants/actionTypes';
import BatchOptions from './BatchOptions';

const BatchOptionSelect = ({ name, defaultValue = 'euler', items, ...args }) => {
    const dispatch = useDispatch();
    const [hovered, setHovered] = React.useState(false);

    useEffect(() => { dispatch({ type: INIT_BATCH_OPTION, payload: { name, values: [defaultValue], idx: 0 } }); })
    const data = useSelector(state => state.main.options[name]);
    const handleOptChange = (e) => { dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? e.target.value : v) } }) }
    return (
        <Box sx={{ display: 'inline-block', position: 'relative' }} onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}>
            {data && <>
                <Select sx={{ minWidth: 150 }} value={data.values[data.idx]} onChange={handleOptChange} {...args}>
                    {items.map((item, i) => <MenuItem key={i} value={item.key}>{item.value}</MenuItem>)}
                </Select>
                {(hovered || data.values.length > 1) && <BatchOptions data={data} defaultValue={defaultValue} />}</>}
        </Box>
    )
}

export default BatchOptionSelect