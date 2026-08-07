import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import {globalIgnores, defineConfig} from 'eslint/config';

export default defineConfig(
    globalIgnores([
        'node_modules',
        'dist',
        'esbuild.config.mjs',
        'version-bump.mjs',
        'versions.json',
        'main.js',
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        "test-vault",
        "server"
    ]),
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['eslint.config.mts', 'manifest.json'],
                },
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: ['.json'],
            },
        },
    },
    ...obsidianmd.configs.recommended,
    {
        rules: {
            "eslint-comments/no-restricted-disable": "off",
            "obsidianmd/ui/sentence-case": ["warn", {
                acronyms: ["JSP"],
                brands: ["Just Share Please", "Obsidian"]
            }]
        }
    }
);
