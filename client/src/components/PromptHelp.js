import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import PromptHelper from './PromptHelper';
import promptSuggestions from '../constants/promptSuggestions';
import { Divider } from '@mui/material';

const PromptHelp = ({ options, optNames }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            <Button onClick={handleClick} variant='outlined'>
                Prompt Help
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
            >
                {Object.keys(promptSuggestions).map((suggestType, i) => (
                    <MenuItem key={i} sx={{ ...(i > 0 && { borderTop: '1px solid #aaa' }) }}> <PromptHelper options={options} optNames={optNames} name={suggestType} data={promptSuggestions[suggestType]} /> </MenuItem>

                ))}
            </Menu>
        </div>
    );
}
export default PromptHelp;