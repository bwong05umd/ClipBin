import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Box,
  Container,
  Typography,
  Paper,
  LinearProgress,
  Button,
  TextField,
  IconButton,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  ContentCopy as CopyIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { config } from '../config';

function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareUrl, setShareUrl] = useState('');
  const [error, setError] = useState('');

  // Debug: Log the API URL to console
  console.log('API_BASE_URL:', config.API_BASE_URL);
  console.log('Environment variables:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    MODE: import.meta.env.MODE
  });

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile && selectedFile.type === 'video/mp4') {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Please select an MP4 video file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4']
    },
    maxFiles: 1,
    disabled: uploading
  });

  async function uploadVideo(file) {
    if (!config.API_BASE_URL) {
      throw new Error('API URL not configured');
    }

    const formData = new FormData();
    formData.append('video', file);

    const response = await fetch(`${config.API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }
    return await response.json();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const data = await uploadVideo(file);
      setShareUrl(data.shareUrl);
      toast.success('Video uploaded successfully!');
    } catch (err) {
      setError(err.message);
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Stack spacing={4}>
          <Box textAlign="center">
            <Typography variant="h4" component="h1" gutterBottom>
              ClipBin
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Upload your gameplay videos and share them with friends
            </Typography>
            {/* Debug info - remove in production */}
            {config.DEBUG && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                API URL: {config.API_BASE_URL}
              </Typography>
            )}
          </Box>

          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              transition: 'all 0.2s ease',
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? 'Drop the video here'
                : 'Drag & drop a video, or click to select'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Only MP4 files are supported
            </Typography>
          </Box>

          {file && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Selected file: {file.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
              </Typography>
            </Box>
          )}

          {uploading && (
            <Box sx={{ width: '100%' }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}

          {error && (
            <Typography color="error" align="center">
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!file || uploading}
            startIcon={<UploadIcon />}
            fullWidth
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </Button>

          {shareUrl && (
            <Paper
              elevation={2}
              sx={{
                p: 2,
                bgcolor: 'success.light',
                color: 'success.contrastText',
                borderRadius: 2,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <SuccessIcon />
                <Typography variant="subtitle1">Upload Complete!</Typography>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Share your video:
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    value={shareUrl}
                    fullWidth
                    size="small"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                  <IconButton
                    onClick={copyToClipboard}
                    color="inherit"
                    sx={{ bgcolor: 'success.dark' }}
                  >
                    <CopyIcon />
                  </IconButton>
                </Stack>
              </Box>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                You can copy and share this link. It will work for 24 hours.
              </Typography>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}

export default Home; 