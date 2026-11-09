import 'dotenv/config';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',workers:1,use:{baseURL:'http://localhost:3000',headless:true,launchOptions:{executablePath:process.env.CHROMIUM_PATH||undefined}},webServer:{command:'npm run dev',url:'http://localhost:3000',reuseExistingServer:false,timeout:120000}});
