import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Box } from '@mui/material';
import { useDispatch } from 'react-redux';
import { SET_BATCH_OPTION } from '../constants/actionTypes';

const fakeOptions = [
]
for (let i = 0; i < 10; i++) {
    fakeOptions.push(`Option ${i + 1}`);
}
const PromptHelper = ({ name, data, options, optNames }) => {
    const dispatch = useDispatch();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const addToPrompt = (token, optName) => {
        const data = options[optNames[optName]]
        if (data.values[data.idx] === '') {
            dispatch({
                type: SET_BATCH_OPTION,
                payload: { ...data, values: data.values.map((v, i) => i === data.idx ? token : v) }
            })
        } else {
            dispatch({
                type: SET_BATCH_OPTION,
                payload: { ...data, values: data.values.map((v, i) => i === data.idx ? v + ', ' + token : v) }
            })
        }
    }

    return (
        <Box sx={{ textAlign: 'left' }}>
            <Button onClick={handleClick} >
                {name}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={
                    Array.isArray(data) ?
                        {
                            vertical: "top",
                            horizontal: "right",
                        } : {
                            vertical: "bottom",
                            horizontal: "right",
                        }
                }
            >
                {Array.isArray(data) ? data.map((option) => (
                    <MenuItem key={option} onClick={() => addToPrompt(option, name.includes('Negative') ? 'negative_prompt' : 'prompt')}>
                        {option}
                    </MenuItem>
                )) : Object.keys(data).map((option, i) => (
                    <MenuItem key={i} sx={{ ...(i > 0 && { borderTop: '1px solid #aaa' }) }}>
                        <PromptHelper options={options} optNames={optNames} name={option} data={data[option]} />
                    </MenuItem>))
                }
            </Menu>
        </Box >
    );
}
export default PromptHelper;