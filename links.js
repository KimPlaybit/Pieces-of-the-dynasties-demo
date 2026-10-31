// Opens the game's links (its itch.io page, the Discord invite) in a new tab — see Platform/BrowserLinks.cs.
// Called during the frame that handles the click, which is still inside the click's user activation,
// so popup blockers let it through.
export function open(url) {
    window.open(url, '_blank', 'noopener');
}
