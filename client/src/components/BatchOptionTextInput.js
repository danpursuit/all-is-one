import { Box, Button, TextField, IconButton, Stack, Typography, getStepButtonUtilityClass } from '@mui/material'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { INIT_BATCH_OPTION, SET_BATCH_OPTION } from '../constants/actionTypes';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import styles from './styles';
import BatchOptions from './BatchOptions';
const BatchOptionTextInput = ({ name, defaultValue = '', ...args }) => {
    const dispatch = useDispatch();
    const [hovered, setHovered] = React.useState(false);
    // on startup, dispatch to initialize values
    useEffect(() => { dispatch({ type: INIT_BATCH_OPTION, payload: { name, values: [defaultValue], idx: 0 } }); })
    const data = useSelector(state => state.main.options[name]);
    const handleOptChange = (e) => { dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? e.target.value : v) } }) }
    return (
        <Box sx={{ display: 'inline-block', position: 'relative' }} onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}>
            {data && <>
                <TextField value={data.values[data.idx]} onChange={handleOptChange} {...args} />
                {(hovered || data.values.length > 1) && <BatchOptions data={data} defaultValue={defaultValue} />}</>}
        </Box>
    )
}

export default BatchOptionTextInput