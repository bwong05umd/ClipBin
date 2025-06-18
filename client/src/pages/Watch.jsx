import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Watch() {
  const { id } = useParams();
  const [videoInfo, setVideoInfo] = useState(null);
  const videoUrl = `http://localhost:3001/watch/${id}`;

  useEffect(() => {
    // In a real app, you would fetch video metadata from the server
    // For now, we'll just use the URL
    setVideoInfo({
      url: videoUrl,
      filename: `clip-${id}.mp4`,
    });
  }, [id, videoUrl]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Stack spacing={4}>
          <Box textAlign="center">
            <Typography variant="h4" component="h1" gutterBottom>
              ClipBin
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Watch and download gameplay videos
            </Typography>
          </Box>

          <Box
            sx={{
              width: '100%',
              maxWidth: 800,
              mx: 'auto',
              bgcolor: 'black',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <video
              controls
              style={{ width: '100%', display: 'block' }}
              controlsList="nodownload"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Box>

          {videoInfo && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              alignItems="center"
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                href={videoUrl}
                download
                sx={{ minWidth: 200 }}
              >
                Download Video
              </Button>
              <IconButton
                onClick={copyToClipboard}
                color="primary"
                sx={{ bgcolor: 'action.hover' }}
              >
                <CopyIcon />
              </IconButton>
            </Stack>
          )}

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Share this video with your friends
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default Watch; 