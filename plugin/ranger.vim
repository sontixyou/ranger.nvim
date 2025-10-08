" Ranger: Neovim File Explorer Tree
" Vim plugin registration for denops.vim

" Prevent double loading
if exists('g:loaded_ranger')
  finish
endif
let g:loaded_ranger = 1

" NOTE: User commands are defined in denops/ranger/main.ts
" The denops plugin is automatically detected from the denops/ranger/ directory

" Default Keybindings
" ==================

" Global keybinding to open ranger (optional, disabled by default)
" Users can enable by setting g:ranger_enable_global_keybinding = 1
if get(g:, 'ranger_enable_global_keybinding', 0)
  nnoremap <leader>e :RangerOpen<CR>
endif

" Buffer-local keybindings are set up in the TypeScript code
" when the ranger buffer is created. See src/ui/interaction.ts
" and denops/ranger/main.ts for the keybinding setup.
"
" Default buffer-local mappings (set by TypeScript):
"   <CR>  - Open file or expand/collapse directory
"   <Tab> - Expand/collapse directory
"   a     - Create file
"   A     - Create directory
"   d     - Delete file/directory
"   r     - Rename file/directory
"   c     - Copy (placeholder)
"   x     - Cut (placeholder)
"   p     - Paste (placeholder)
"   H     - Toggle hidden files
"   /     - Search
"   s     - Open with system app
"   R     - Refresh tree

" Configuration Variables
" =======================

" Customize keybindings by setting g:ranger_mappings before loading
" Example:
"   let g:ranger_mappings = {
"     \ '<CR>': 'open',
"     \ '<Space>': 'expandCollapse',
"     \ 'a': 'createFile',
"     \ }
"
" Note: Custom mappings are not yet implemented in the TypeScript code.
" This is a placeholder for future enhancement.
