import React from 'react';
import { Card, CardContent, Fab, CardActionArea, Button, Typography, Box, Stack, Slider, TextField, Tooltip, IconButton } from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'


const OptionStack = ({ label, target, optionName, min, max, rounder, getVal, setCf, ...args }) => {
    // return (<Stack direction='column' spacing={0.2} sx={{ flex: '1 1' }}>
    return (<Stack direction='column' spacing={0.2}>
        {/* <Typography>{label}: {textOption({ target, optionName, getVal, min, max, rounder })}</Typography> */}
        <Typography>{label}: {target[optionName]}</Typography>
        <Slider value={target[optionName]} onChange={(e, v) => setCf({ ...target, [optionName]: v })} min={min} max={max} step={rounder} {...args} />
    </Stack>)
}

// todo: make textoption work. currently the validation fires too fast
const textOption = ({ optionName, target, min, max, rounder, setCf }) => {
    return <TextField value={target[optionName]} margin='none' inputProps={{
        style: {
            padding: 0,
            paddingLeft: '2px',
            width: '2.5em'
        }
    }} onChange={e => {
        let val = parseFloat(e.target.value);
        if (val < min) val = min;
        if (val > max) val = max;
        setCf({ ...target, [optionName]: val });
    }} />
}
const ImageSizer = ({ target, suffix, setCf, fixedHeight = null, fixedWidth = null }) => {
    const getZoom = (v) => { if (v) return v['z' + suffix] ? Math.round(v['z' + suffix] * 100) / 100 : 1; return 1; }
    const getX = (v) => { if (v) return v['x' + suffix] ? Math.round(v['x' + suffix]) : 0; return 0; }
    const getY = (v) => { if (v) return v['y' + suffix] ? Math.round(v['y' + suffix]) : 0; return 0; }
    const getH = (v) => { if (fixedHeight) return fixedHeight; if (v) return v['h' + suffix] ? Math.round(v['h' + suffix]) : 512; return 512; }
    const getW = (v) => { if (fixedWidth) return fixedWidth; if (v) return v['w' + suffix] ? Math.round(v['w' + suffix]) : 512; return 512; }
    const [ztest, setZtest] = React.useState(getZoom(target));
    const minXoffset = 0;
    const maxXoffset = fixedWidth ? fixedWidth : 512;
    const offsetStep = 1;
    const offsetMax = 1024;
    const resetToDefault = () => {
        const defaults = {}
        Object.keys(target.defaults).forEach(k => {
            // if k ends in suffix
            if (k.endsWith(suffix)) {
                defaults[k] = target.defaults[k];
            }
        })
        setCf({ ...target, ...defaults });
    }

    return (<Stack direction='row' spacing={2} sx={{ flex: '1 1', px: 1 }}>
        <Stack direction={'column'} spacing={1} sx={{ flex: '0 0 40px' }}>
            <Typography sx={{ textAlign: 'center', fontWeight: 'bold' }}>{fixedHeight ? 'Input' : 'Output'}</Typography>
            <Button variant='outlined' onClick={resetToDefault}>Reset</Button>
        </Stack>
        <Grid container spacing={2} sx={{ flex: '1 1' }}>
            <Grid item xs={4}>
                <OptionStack label='X Offset' target={target} setCf={setCf} optionName={`x${suffix}`}
                    min={fixedWidth ? -fixedWidth : -offsetMax} max={fixedWidth ? fixedWidth : offsetMax} rounder={4} />
            </Grid>
            <Grid item xs={4}>
                <OptionStack label='Y Offset' target={target} setCf={setCf} optionName={`y${suffix}`}
                    min={fixedHeight ? -fixedHeight : -offsetMax} max={fixedHeight ? fixedHeight : offsetMax} rounder={4} />
            </Grid>
            <Grid item xs={4}>
                {fixedHeight ? <OptionStack label='Zoom' target={target} setCf={setCf} optionName={`z${suffix}`}
                    min={fixedHeight ? 0.1 : 0.05} max={fixedHeight ? 4 : 1} rounder={0.05} /> : <Typography>Zoom: {target[`z${suffix}`]}</Typography>}
            </Grid>
            <Grid item xs={4}>
                {fixedHeight ? <Typography>Height: {target[`h${suffix}`]}</Typography> :
                    <OptionStack label='Height' target={target} setCf={setCf} optionName={`h${suffix}`}
                        min={64} max={2048} rounder={32} />}
            </Grid>
            <Grid item xs={4}>
                {fixedHeight ? <Typography>Width: {target[`w${suffix}`]}</Typography> :
                    <OptionStack label='Width' target={target} setCf={setCf} optionName={`w${suffix}`}
                        min={64} max={2048} rounder={32} />}
            </Grid>
            {fixedHeight &&
                <Grid item xs={4}>
                    <Stack direction='row' spacing={1}>
                        <Button
                            variant='outlined'
                            onClick={() => setCf({ ...target, [`z${suffix}`]: target.h_out / fixedHeight, w_out: Math.floor(fixedWidth * target.h_out / fixedHeight) })}>
                            Sync Height
                        </Button>
                        <Button
                            variant='outlined'
                            onClick={() => setCf({ ...target, [`z${suffix}`]: target.w_out / fixedWidth, h_out: Math.floor(fixedHeight * target.w_out / fixedWidth) })}>
                            Sync Width
                        </Button>
                    </Stack>
                </Grid>}
        </Grid>
        {/* show a disabled bar <OptionStack label='Height' target={target} setCf={setCf} optionName={`h${suffix}`}
            min={0} max={fixedHeight} rounder={1} disabled /> */}
    </Stack >)
}

export default ImageSizer;