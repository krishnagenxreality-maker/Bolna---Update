import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to handle local serving and production bundling of the Audio folder
function copyAudioDirPlugin() {
  return {
    name: 'copy-audio-dir',
    // Dev server middleware to serve root '/Audio' directory files
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const decodedUrl = decodeURIComponent(req.url || '');
        if (decodedUrl.startsWith('/Audio/') || decodedUrl.startsWith('/audio/')) {
          const fileName = decodedUrl.substring(7); // remove '/Audio/' or '/audio/'
          const filePath = path.join(__dirname, 'Audio', fileName);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'audio/mpeg');
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    },
    // Build hook to copy 'Audio' directory to 'dist/Audio' and 'dist/audio'
    closeBundle() {
      const srcDir = path.resolve(__dirname, 'Audio');
      if (!fs.existsSync(srcDir)) {
        console.warn('Source Audio folder not found at:', srcDir);
        return;
      }

      // Copy to both 'dist/Audio' and 'dist/audio' to handle case sensitivity in Linux environments
      const targetDirs = [
        path.resolve(__dirname, 'dist/Audio'),
        path.resolve(__dirname, 'dist/audio')
      ];

      for (const destDir of targetDirs) {
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        const files = fs.readdirSync(srcDir);
        for (const file of files) {
          const srcFile = path.join(srcDir, file);
          const destFile = path.join(destDir, file);
          if (fs.statSync(srcFile).isFile()) {
            fs.copyFileSync(srcFile, destFile);
          }
        }
      }
      console.log('Audio files successfully copied to dist/Audio and dist/audio');
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyAudioDirPlugin()],
  server: {
    host: '0.0.0.0',
  }
})

