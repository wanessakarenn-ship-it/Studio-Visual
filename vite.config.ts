import {defineConfig} from 'vite';
export default defineConfig({build:{rollupOptions:{input:{legacy:'index.html',studio:'studio-v2.html'}}}});
