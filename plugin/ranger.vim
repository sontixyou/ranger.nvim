" Ranger: Neovim File Explorer Tree
" Vim integration for denops plugin

if exists('g:loaded_ranger')
  finish
endif
let g:loaded_ranger = 1

" Register denops plugin
" This tells Neovim to load the TypeScript plugin via denops.vim
call denops#plugin#register('ranger')

" User commands will be added in later tasks
" Placeholder for future commands like :RangerOpen
