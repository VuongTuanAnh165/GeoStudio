import { ref, readonly } from 'vue';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export function useCamera() {
  const stream = ref<MediaStream | null>(null);
  const error = ref<string | null>(null);
  const cameras = ref<CameraDevice[]>([]);
  const activeCameraId = ref<string>('');
  const isRequesting = ref(false);

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      cameras.value = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${cameras.value.length + 1}`
        }));
    } catch (err) {
      console.warn('Could not enumerate devices:', err);
    }
  };

  const start = async (deviceId?: string) => {
    if (isRequesting.value) return;
    
    try {
      isRequesting.value = true;
      error.value = null;

      // Stop existing stream
      stop();

      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.value = mediaStream;
      
      // Update active device id
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        activeCameraId.value = track.getSettings().deviceId || deviceId || '';
      }

      // Re-enumerate to get labels if permissions just granted
      await enumerateDevices();
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      error.value = err.message || 'Permission denied or no camera found';
    } finally {
      isRequesting.value = false;
    }
  };

  const stop = () => {
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop());
      stream.value = null;
    }
  };

  return {
    stream: readonly(stream),
    error: readonly(error),
    cameras: readonly(cameras),
    activeCameraId,
    isRequesting: readonly(isRequesting),
    start,
    stop,
    enumerateDevices
  };
}
