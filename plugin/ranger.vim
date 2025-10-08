" Ranger: Neovim File Explorer Tree
" Vim plugin registration for denops.vim

" Prevent double loading
if exists('g:loaded_ranger')
  finish
endif
let g:loaded_ranger = 1

" Register denops plugin
" This tells Neovim to load the TypeScript plugin via denops.vim
call denops#plugin#register('ranger')

" User Commands
" ============

" Open the tree explorer
command! -nargs=0 RangerOpen call denops#notify('ranger', 'openTree', [])

" File operations (require tree to be open)
command! -nargs=0 RangerCreateFile call denops#notify('ranger', 'createFile', [])
command! -nargs=0 RangerCreateDirectory call denops#notify('ranger', 'createDirectory', [])
command! -nargs=0 RangerDelete call denops#notify('ranger', 'deleteNode', [])
command! -nargs=0 RangerRename call denops#notify('ranger', 'renameNode', [])
command! -nargs=0 RangerToggleHidden call denops#notify('ranger', 'toggleHidden', [])
command! -nargs=0 RangerSearch call denops#notify('ranger', 'search', [])
command! -nargs=0 RangerSystemOpen call denops#notify('ranger', 'systemOpen', [])
command! -nargs=0 RangerRefresh call denops#notify('ranger', 'refresh', [])

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
