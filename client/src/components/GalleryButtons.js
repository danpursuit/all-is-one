import { Button, Card, Checkbox, FormControlLabel, FormGroup, MenuItem, Select, Slider, Stack, IconButton, Typography, Box, Grid, TextField, ClickAwayListener, Tooltip } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import FileCopyTwoToneIcon from '@mui/icons-material/FileCopyTwoTone';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';
import GridOnTwoToneIcon from '@mui/icons-material/GridOnTwoTone';
import CircularProgress from '@mui/material/CircularProgress';
import SourceIcon from '@mui/icons-material/Source';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ClearIcon from '@mui/icons-material/Clear';
import SendIcon from '@mui/icons-material/Send';
import { NestedDropdown } from './NestedMenu/components/NestedDropdown.tsx';
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';

import { SHOW_FOLDER, CONFIRM_DELETE, CONFIRM_DELETE_BATCH, IMG2IMG, MIRROR, SEND_TO_IMG2IMG, SHOW_BATCH, EDITING } from '../constants/features';
import { WebSocketContext } from '../WebSocket';
import { SET_CURRENT_IMAGE, SET_BATCH_OPTIONS, DELETE_SINGLE_IMAGE, DELETE_BATCH, SET_BATCH_OPTION, SET_LOCATION } from '../constants/actionTypes';
import { setTip } from '../actions';
import { getImgSubDefaults, img2imgOpts } from '../constants/options';

const styles = {
    img: {
        display: 'block',
        margin: 'auto',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        cursor: 'pointer'
        // maxHeight: '400px'
    },
    imgLarge: {
        width: '400px',
        height: '400px'
    },
    selected: {
        boxSizing: 'border-box',
        border: '4px solid #0000ff',
    },
    deleteButt0: {

    },
    deleteButt1: {
        backgroundColor: '#ff8888',
        '&:hover': {
            backgroundColor: '#ff0000',
        }
    }
}
export const DeleteButt = ({ op, ws, data, submitStatus, showBatch }) => {
    const dispatch = useDispatch();
    const [deleteMode, setDeleteMode] = React.useState(0);
    const tryDeleteImage = () => {
        if (data.currentImage <= -1) {
            setDeleteMode(0);
            return;
        }
        if (deleteMode === 0) {
            setDeleteMode(1);
            if (showBatch) {
                dispatch(setTip(CONFIRM_DELETE_BATCH));
            } else {
                dispatch(setTip(CONFIRM_DELETE));
            }
            return;
        } else if (deleteMode === 1) {
            setDeleteMode(0);
            if (showBatch) {
                ws.deleteBatch({ op, idx: data.currentImage });
            } else {
                ws.deleteSingleImage({ op, idx: data.currentImage });
            }
            return;
        }
    }
    return (
        <ClickAwayListener onClickAway={() => setDeleteMode(0)}>
            <Tooltip title={deleteMode === 1 ? 'Confirm Delete' : 'Delete'}><span>
                <IconButton disabled={data.numImages <= 0 || submitStatus.inProgress || submitStatus.submitting}
                    onClick={tryDeleteImage} sx={styles['deleteButt' + deleteMode]}
                    onMouseEnter={() => {
                        if (deleteMode === 0) {
                            dispatch(setTip(showBatch ? DELETE_BATCH : DELETE_SINGLE_IMAGE))
                        }
                    }}>
                    <ClearIcon />
                </IconButton></span></Tooltip></ClickAwayListener>)
}
export const CopySettingsButt = ({ mirroring, setMirroring }) => {
    const dispatch = useDispatch();
    return (<Tooltip title="Copy Settings"><Checkbox
        onMouseEnter={() => dispatch(setTip(MIRROR))}
        checked={mirroring}
        onClick={() => setMirroring(!mirroring)}
        icon={<FileCopyOutlinedIcon />}
        checkedIcon={<FileCopyTwoToneIcon />} /></Tooltip>)
}
export const NavLabel = ({ data, op }) => {
    const dispatch = useDispatch();
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <TextField value={data.currentImage + 1} onChange={e => {
                const idx = parseInt(e.target.value) - 1;
                if (idx >= 0 && idx < data.numImages) {
                    dispatch({ type: SET_CURRENT_IMAGE, payload: { op, idx } });
                }
            }} sx={{ width: data.numImages > 999 ? '5em' : '4em' }} size='small' />
            <Typography>of {data.numImages}</Typography>
        </Stack>)
}
export const ShowEntireJobButt = ({ showBatch, setShowBatch }) => {
    const dispatch = useDispatch();
    return (<Tooltip title="Batch Display">
        <Checkbox
            onMouseEnter={() => dispatch(setTip(SHOW_BATCH))}
            checked={showBatch}
            onClick={() => setShowBatch(!showBatch)}
            icon={<GridOnOutlinedIcon />}
            checkedIcon={<GridOnTwoToneIcon />} /></Tooltip>)
}
export const PrevButt = (args) => {
    return (
        <IconButton {...args}>
            <NavigateBeforeIcon />
        </IconButton>)
}
export const NextButt = (args) => {
    return (
        <IconButton {...args}>
            <NavigateNextIcon />
        </IconButton>)
}
export const SendToImgButt = ({ data }) => {
    const dispatch = useDispatch();
    const sendImgToImg = (location) => {
        if (!data || !data.imgData[data.currentImage] || !data.imgData[data.currentImage].imgResult)
            return;
        dispatch({ type: SET_LOCATION, payload: { location, preset: data.imgData[data.currentImage].imgResult } });
    }
    const menuItemsData = {
        label: '',
        items: [
            {
                label: 'Send to Img2Img',
                callback: () => sendImgToImg(IMG2IMG)
            },
            {
                label: 'Send to Editing',
                callback: () => sendImgToImg(EDITING)
            }
        ]
    }
    // return (<Tooltip title="Send to Img2Img">
    //     <span>
    //         <IconButton disabled={!data?.imgData[data.currentImage]?.imgResult} onClick={() => sendImgToImg2Img(data.imgData[data.currentImage].imgResult)}
    //             onMouseEnter={() => dispatch(setTip(SEND_TO_IMG2IMG))}>
    //             <SendIcon />
    //         </IconButton>
    //     </span>
    // </Tooltip>)
    return (
        <NestedDropdown
            menuItemsData={menuItemsData}
            MenuProps={{ elevation: 3 }}
            ButtonProps={{
                disabled: !data?.imgData[data.currentImage]?.imgResult,
                onMouseEnter: () => dispatch(setTip(SEND_TO_IMG2IMG))
            }}
            // onClick={() => setComputeItems(true)}
            closeCallback={() => null}
            useIcon
        />
    )
}
export const ShowFolderButt = ({ op, ws }) => {
    const dispatch = useDispatch();
    return (
        <Tooltip title="Show Folder">
            <IconButton
                onClick={() => ws.showFolder({ location: op })}
                onMouseEnter={() => dispatch(setTip(SHOW_FOLDER))}>
                <FolderOpenIcon />
            </IconButton></Tooltip>)
}