import * as React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { CircularProgress, Stack } from '@mui/material';
import Box from '@mui/material/Box';

const styles = {
    outer: { display: 'flex', alignItems: 'center' },
    inner: { flex: '1 1' },
}
const JobProgress = ({ submitStatus }) => {
    if (submitStatus.submitting) {
        return (
            <Stack sx={{ minWidth: 80 }} direction='row' spacing={1} justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Submitting...</Typography>
                <Box sx={styles.inner}>
                    <LinearProgress variant="determinate" value={submitStatus.currentCount / submitStatus.expectedCount * 100} />
                </Box>
            </Stack>
        );
    } else if (submitStatus.inProgress || submitStatus.done) {
        return (
            <Stack sx={{ minWidth: 80 }} direction='row' spacing={1} justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">{`${submitStatus.currentCount} / ${submitStatus.expectedCount}`}</Typography>
                {submitStatus.inProgress ? <CircularProgress size={20} /> : <Typography variant="body2" color="text.secondary">Done!</Typography>}

                <Box sx={styles.inner}>
                    <LinearProgress variant="determinate" value={submitStatus.currentCount / submitStatus.expectedCount * 100} />
                </Box>
            </Stack>
        );
    }
    return null;
}

export default JobProgress;