/// <reference types="node" />
import { defineConfig } from 'kubb/config'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig(() => {
    const apiBase = process.env.NUXT_LOGISTICSHUB_BACKEND_API_BASE

    return {
        root: '.',
        input: `${apiBase}/api/v1/docs.json`,
        output: {
            path: './app/schemas',
            clean: true,
        },
        plugins: [
            pluginZod({
                output: {
                    path: './zod',
                },
            }),
        ],
    }
})