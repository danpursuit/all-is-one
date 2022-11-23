import { useSelector, useDispatch } from 'react-redux';
import { Card, Grid, CardContent, Fab, CardActionArea, Button, Typography, Box } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search';
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CollectionsIcon from "@mui/icons-material/Collections";
import React from 'react'

import { IMG2IMG } from '../constants/features';
import { setTip } from '../actions';
import { IMG_UPLOAD, INIT_BATCH_OPTION, SET_BATCH_OPTION } from '../constants/actionTypes';
import { WebSocketContext } from '../WebSocket';
import BatchOptions from './BatchOptions';

const size = '350px';
const styles = {
    container: { position: 'relative', margin: 'auto', width: size, height: size, my: 1 },
    formOuter: {
        // height: '16rem',
        // width: '28rem',
        // maxWidth: '100%',
        // textAlign: 'center',
        // position: 'relative',
        // top: 0,
    },
    label: {
        // height: '100%',
        // display: 'flex',
        // alignItems: 'center',
        // justifyContent: 'center',
        position: 'absolute',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
    },
    labelBlank: {
        borderWidth: '2px',
        borderRadius: '1rem',
        borderStyle: 'dashed',
        borderColor: '#cbd5e1',
        backgroundColor: '#f8fafc',
    },
    dragScreen: {
        backgroundColor: 'green',
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '1rem',
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
    },
    img: {
        width: size,
        height: size,
        objectFit: 'contain',
    }
}
const defaultValue = null;
const ImageUpload = ({ name }) => {
    const dispatch = useDispatch();
    const blankImg = useSelector(state => state.main.blanks.image);
    const [hovered, setHovered] = React.useState(false);
    // on startup, dispatch to initialize values
    React.useEffect(() => { dispatch({ type: INIT_BATCH_OPTION, payload: { name, values: [defaultValue], idx: 0 } }); })
    const data = useSelector(state => state.main.options[name]);

    const [disableSubmit, setDisableSubmit] = React.useState(false);
    // whenever disableSubmit is set to true, set a timer to set it back to false
    React.useEffect(() => {
        if (disableSubmit) {
            setTimeout(() => {
                setDisableSubmit(false);
            }, 2000);
        }
    }, [disableSubmit])

    // drag state
    const [dragActive, setDragActive] = React.useState(false);
    // handle drag events
    const handleUpload = (img) => { dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? img : v) } }) }

    const handleDrag = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    const handleDrop = function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                handleUpload(reader.result);
            }
            reader.readAsDataURL(file);
            // at least one file has been dropped so do something
            // handleFiles(e.dataTransfer.files);
        }
    };
    const handleChange = function (e) {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                handleUpload(reader.result);
            }
            reader.readAsDataURL(file);
        }
    };
    const clearImage = (e) => {
        if (data.values[data.idx]) {
            e.preventDefault();
            dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? defaultValue : v) } })
        }
    }
    return (
        <Box sx={styles.container} onMouseEnter={() => { dispatch(setTip(name)); setHovered(true) }}
            onMouseLeave={() => setHovered(false)}>
            {data && <>
                <form onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()} style={{ ...styles.formOuter }}>
                    <input type="file" id="input-file-upload" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
                    <label id="label-file-upload" htmlFor="input-file-upload" style={{ ...styles.label, ...(data.values[data.idx] === null && styles.labelBlank) }}>
                        {/* <Box styles={{ ...styles.img, backgroundColor: 'blue' }}></Box> */}
                        {/* <img src={data.values[data.idx] !== null ? data.values[data.idx] : blankImg}
                            onClick={clearImage} styles={styles.img} /> */}
                        <img src={data.values[data.idx] !== null ? data.values[data.idx] : blankImg} onClick={clearImage} style={styles.img} />
                    </label>
                    {dragActive && <div style={styles.dragScreen} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
                </form>
                {(hovered || data.values.length > 1) && <BatchOptions data={data} defaultValue={defaultValue} />}
            </>}
        </Box>
    )
}

export default ImageUpload