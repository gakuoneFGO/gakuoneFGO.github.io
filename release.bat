@echo off
call tsc cli-tools\release.ts
call node cli-tools\release.js %*